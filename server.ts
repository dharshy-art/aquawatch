import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase, persistDatabase } from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Helper to convert SQL query results to array of objects
function queryAll(db: any, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// 1. Dashboard summary
app.get('/api/dashboard', async (req, res) => {
  try {
    const db = await getDatabase();

    // Latest date in usage
    const datesResult = queryAll(db, `SELECT DISTINCT date FROM water_usage ORDER BY date DESC LIMIT 14`);
    const availableDates = datesResult.map(r => r.date);

    let todayConsumption = 0;
    let prevConsumption = 0;
    let baselineDailyAvg = 0;
    let currentDailyAvg = 0;
    let waterSaved = 0;
    let waterSavedPercentage: number | null = null;
    let consumptionTrendPercent: number | null = null;

    if (availableDates.length > 0) {
      const latestDate = availableDates[0];
      const todayRows = queryAll(db, `SELECT SUM(litres_used) as total FROM water_usage WHERE date = ?`, [latestDate]);
      todayConsumption = todayRows[0]?.total || 0;

      if (availableDates.length > 1) {
        const prevDate = availableDates[1];
        const prevRows = queryAll(db, `SELECT SUM(litres_used) as total FROM water_usage WHERE date = ?`, [prevDate]);
        prevConsumption = prevRows[0]?.total || 0;

        if (prevConsumption > 0) {
          consumptionTrendPercent = Number((((todayConsumption - prevConsumption) / prevConsumption) * 100).toFixed(1));
        }
      }

      // Baseline vs Conservation Period:
      // If we have >= 8 days, older days are baseline, recent 7 are current
      if (availableDates.length >= 7) {
        const recentDates = availableDates.slice(0, 7);
        const baselineDates = availableDates.slice(7);

        const recentRows = queryAll(db, `
          SELECT SUM(litres_used) as total FROM water_usage 
          WHERE date IN (${recentDates.map(() => '?').join(',')})
        `, recentDates);
        currentDailyAvg = Math.round((recentRows[0]?.total || 0) / recentDates.length);

        if (baselineDates.length > 0) {
          const baselineRows = queryAll(db, `
            SELECT SUM(litres_used) as total FROM water_usage 
            WHERE date IN (${baselineDates.map(() => '?').join(',')})
          `, baselineDates);
          baselineDailyAvg = Math.round((baselineRows[0]?.total || 0) / baselineDates.length);

          if (baselineDailyAvg > 0) {
            waterSaved = Math.max(0, baselineDailyAvg - currentDailyAvg);
            waterSavedPercentage = Number((((baselineDailyAvg - currentDailyAvg) / baselineDailyAvg) * 100).toFixed(1));
          }
        }
      }
    }

    // Leaks detected (unresolved or confirmed leaks)
    const leakRows = queryAll(db, `
      SELECT 
        COUNT(*) as total_reported,
        SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as total_verified,
        SUM(CASE WHEN status != 'Resolved' THEN 1 ELSE 0 END) as active_leaks,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_leaks
      FROM water_waste_reports
      WHERE waste_type = 'Leaking taps' OR waste_type LIKE '%leak%'
    `);
    const leakStats = leakRows[0] || { total_reported: 0, total_verified: 0, active_leaks: 0, resolved_leaks: 0 };

    // Water conservation score calculation
    const scoreData = calculateConservationScore(db);

    res.json({
      success: true,
      kpis: {
        totalConsumption: {
          value: todayConsumption,
          unit: 'Litres/day',
          previousValue: prevConsumption || null,
          trendPercent: consumptionTrendPercent,
          tooltip: 'Total daily water consumed across all recorded school and facility sub-meters today.',
        },
        waterSaved: {
          value: waterSaved,
          unit: 'Litres saved/day',
          percentageReduction: waterSavedPercentage,
          baselineDailyAvg,
          currentDailyAvg,
          tooltip: 'Daily water conserved compared against the pre-intervention baseline period average.',
        },
        leaksDetected: {
          activeCount: leakStats.active_leaks || 0,
          verifiedCount: leakStats.total_verified || 0,
          resolvedCount: leakStats.resolved_leaks || 0,
          totalReported: leakStats.total_reported || 0,
          unit: 'Active leaks',
          tooltip: 'Total tap leaks currently in progress or awaiting inspection versus resolved incidents.',
        },
        conservationScore: {
          score: scoreData.score,
          status: scoreData.status,
          grade: scoreData.grade,
          indicators: scoreData.indicators,
          unit: '/ 100',
          tooltip: 'Documented weighted conservation index based on water reduction, leak resolution, and inspection frequency.',
        }
      },
      latestDate: availableDates[0] || null,
      dataAvailability: {
        hasUsageRecords: availableDates.length > 0,
        hasBaseline: baselineDailyAvg > 0,
        totalRecords: queryAll(db, `SELECT COUNT(*) as count FROM water_usage`)[0]?.count || 0,
      }
    });
  } catch (err: any) {
    console.error('Dashboard API Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper for transparent score calculation
function calculateConservationScore(db: any) {
  // Indicator 1: Consumption Reduction (Weight: 35%)
  const dates = queryAll(db, `SELECT DISTINCT date FROM water_usage ORDER BY date DESC LIMIT 14`).map(r => r.date);
  let consumptionScore = 0;
  let consumptionDataAvailable = false;
  let reductionPercent = 0;

  if (dates.length >= 8) {
    const recentDates = dates.slice(0, 7);
    const baselineDates = dates.slice(7);

    const recentAvg = (queryAll(db, `SELECT SUM(litres_used) as total FROM water_usage WHERE date IN (${recentDates.map(() => '?').join(',')})`, recentDates)[0]?.total || 0) / recentDates.length;
    const baseAvg = (queryAll(db, `SELECT SUM(litres_used) as total FROM water_usage WHERE date IN (${baselineDates.map(() => '?').join(',')})`, baselineDates)[0]?.total || 0) / baselineDates.length;

    if (baseAvg > 0) {
      consumptionDataAvailable = true;
      reductionPercent = Math.max(0, ((baseAvg - recentAvg) / baseAvg) * 100);
      // Target: 20% reduction gets full 35 points
      consumptionScore = Math.min(35, Math.round((reductionPercent / 20) * 35));
    }
  }

  // Indicator 2: Leak Resolution Rate (Weight: 25%)
  const leakSummary = queryAll(db, `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved
    FROM water_waste_reports
  `)[0];
  let leakScore = 0;
  let leakDataAvailable = false;
  let leakResolutionRate = 0;

  if (leakSummary && leakSummary.total > 0) {
    leakDataAvailable = true;
    leakResolutionRate = Math.round((leakSummary.resolved / leakSummary.total) * 100);
    leakScore = Math.round((leakResolutionRate / 100) * 25);
  } else if (leakSummary && leakSummary.total === 0) {
    // Zero reported leaks = pristine infrastructure
    leakDataAvailable = true;
    leakResolutionRate = 100;
    leakScore = 25;
  }

  // Indicator 3: Routine Inspection Compliance (Weight: 20%)
  const inspectCount = queryAll(db, `SELECT COUNT(*) as count FROM inspection_records`)[0]?.count || 0;
  const inspectionDataAvailable = true;
  // Goal: at least 3 completed facility inspections gives full 20 pts
  const inspectionScore = Math.min(20, Math.round((inspectCount / 3) * 20));

  // Indicator 4: Student & Community Engagement (Weight: 20%)
  const surveyTotal = queryAll(db, `SELECT SUM(total_responses) as sum FROM student_surveys`)[0]?.sum || 0;
  const surveyDataAvailable = surveyTotal > 0;
  // Goal: at least 20 student survey responses completed
  const surveyScore = Math.min(20, Math.round((surveyTotal / 20) * 20));

  const validIndicators = [
    consumptionDataAvailable,
    leakDataAvailable,
    inspectionDataAvailable,
    surveyDataAvailable
  ].filter(Boolean).length;

  if (validIndicators < 2) {
    return {
      score: null,
      status: 'Insufficient data',
      grade: 'N/A',
      indicators: [
        { name: 'Water Reduction vs Baseline', weight: 35, achieved: 0, status: consumptionDataAvailable ? 'Available' : 'Missing Baseline' },
        { name: 'Leak Resolution Rate', weight: 25, achieved: 0, status: leakDataAvailable ? 'Available' : 'Missing Reports' },
        { name: 'Inspection Records Compliance', weight: 20, achieved: 0, status: 'Available' },
        { name: 'Student Habit Survey Participation', weight: 20, achieved: 0, status: surveyDataAvailable ? 'Available' : 'Missing Surveys' }
      ]
    };
  }

  const totalScore = consumptionScore + leakScore + inspectionScore + surveyScore;
  let grade = 'Needs Attention';
  if (totalScore >= 85) grade = 'Water Hero (Excellent)';
  else if (totalScore >= 70) grade = 'Conserving (Good)';
  else if (totalScore >= 55) grade = 'Moderate';

  return {
    score: totalScore,
    status: 'Measured',
    grade,
    indicators: [
      {
        name: 'Consumption Reduction vs Baseline',
        weight: 35,
        achieved: consumptionScore,
        details: consumptionDataAvailable ? `${reductionPercent.toFixed(1)}% measured reduction` : 'Pending baseline log'
      },
      {
        name: 'Leak Incident Resolution',
        weight: 25,
        achieved: leakScore,
        details: `${leakResolutionRate}% resolved (${leakSummary?.resolved || 0}/${leakSummary?.total || 0})`
      },
      {
        name: 'Facility Inspection Schedule',
        weight: 20,
        achieved: inspectionScore,
        details: `${inspectCount} completed zones inspected`
      },
      {
        name: 'Student Survey Participation',
        weight: 20,
        achieved: surveyScore,
        details: `${surveyTotal} student responses recorded`
      }
    ]
  };
}

// 2. Water usage analytics
app.get('/api/water-usage', async (req, res) => {
  try {
    const db = await getDatabase();
    const days = parseInt(req.query.days as string) || 14;
    const location = (req.query.location as string) || 'all';
    const dataType = (req.query.data_type as string) || 'all';

    let filterSql = `WHERE 1=1`;
    const params: any[] = [];

    if (location !== 'all') {
      filterSql += ` AND location = ?`;
      params.push(location);
    }
    if (dataType !== 'all') {
      filterSql += ` AND data_type = ?`;
      params.push(dataType);
    }

    // Daily trend aggregates
    const dailyRows = queryAll(db, `
      SELECT date, SUM(litres_used) as total_litres
      FROM water_usage
      ${filterSql}
      GROUP BY date
      ORDER BY date ASC
    `, params);

    // Limit to requested days
    const slicedDaily = dailyRows.slice(-days);

    // Breakdown by location
    const locationBreakdown = queryAll(db, `
      SELECT location, SUM(litres_used) as total_litres, COUNT(*) as measurements_count
      FROM water_usage
      ${filterSql}
      GROUP BY location
      ORDER BY total_litres DESC
    `, params);

    // All available distinct locations
    const allLocations = queryAll(db, `SELECT DISTINCT location FROM water_usage ORDER BY location ASC`).map(r => r.location);

    // Recent raw records
    const rawRecords = queryAll(db, `
      SELECT id, date, location, litres_used, measurement_method, data_type
      FROM water_usage
      ${filterSql}
      ORDER BY date DESC, id DESC
      LIMIT 100
    `, params);

    // Before and After comparison
    const allDates = queryAll(db, `SELECT DISTINCT date FROM water_usage ORDER BY date ASC`).map(r => r.date);
    let comparison = {
      hasComparison: false,
      baselinePeriod: 'First 7 Days',
      currentPeriod: 'Latest 7 Days',
      baselineAvg: 0,
      currentAvg: 0,
      litresSaved: 0,
      percentageReduction: 0,
      status: 'Awaiting measurements'
    };

    if (allDates.length >= 8) {
      const mid = Math.floor(allDates.length / 2);
      const baselineDates = allDates.slice(0, mid);
      const currentDates = allDates.slice(mid);

      const baseSum = queryAll(db, `SELECT SUM(litres_used) as total FROM water_usage WHERE date IN (${baselineDates.map(() => '?').join(',')})`, baselineDates)[0]?.total || 0;
      const currSum = queryAll(db, `SELECT SUM(litres_used) as total FROM water_usage WHERE date IN (${currentDates.map(() => '?').join(',')})`, currentDates)[0]?.total || 0;

      const baseAvg = Math.round(baseSum / baselineDates.length);
      const currAvg = Math.round(currSum / currentDates.length);

      if (baseAvg > 0) {
        const saved = Math.max(0, baseAvg - currAvg);
        const reduction = Number((((baseAvg - currAvg) / baseAvg) * 100).toFixed(1));
        comparison = {
          hasComparison: true,
          baselinePeriod: `${baselineDates[0]} to ${baselineDates[baselineDates.length - 1]}`,
          currentPeriod: `${currentDates[0]} to ${currentDates[currentDates.length - 1]}`,
          baselineAvg: baseAvg,
          currentAvg: currAvg,
          litresSaved: saved,
          percentageReduction: reduction,
          status: reduction >= 0 ? `${reduction}% saved` : 'Increase detected'
        };
      }
    }

    res.json({
      success: true,
      dailyTrend: slicedDaily,
      byLocation: locationBreakdown,
      availableLocations: allLocations,
      comparison,
      records: rawRecords
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST water usage record
app.post('/api/water-usage', async (req, res) => {
  try {
    const { date, location, litres_used, measurement_method, data_type } = req.body;

    if (!date || !location || litres_used === undefined || Number(litres_used) < 0) {
      return res.status(400).json({ success: false, error: 'Valid date, location, and non-negative litres_used are required.' });
    }

    const db = await getDatabase();
    const stmt = db.prepare(`
      INSERT INTO water_usage (date, location, litres_used, measurement_method, data_type)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run([
      date,
      location.trim(),
      Number(litres_used),
      measurement_method || 'Manual Meter Reading',
      data_type === 'actual' ? 'actual' : 'illustrative'
    ]);
    stmt.free();
    persistDatabase();

    res.status(201).json({ success: true, message: 'Water usage measurement saved.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Water Waste Reports
app.get('/api/waste-reports', async (req, res) => {
  try {
    const db = await getDatabase();
    const reports = queryAll(db, `
      SELECT id, location, waste_type, description, reported_at, estimated_loss_litres, status, verified
      FROM water_waste_reports
      ORDER BY id DESC
    `);

    // Category counts
    const categoryCounts: Record<string, number> = {
      'Leaking taps': 0,
      'Taps left running': 0,
      'Excessive garden watering': 0,
      'Overflow and spillage': 0
    };

    let totalLossLitres = 0;
    reports.forEach(r => {
      if (categoryCounts[r.waste_type] !== undefined) {
        categoryCounts[r.waste_type]++;
      } else {
        categoryCounts[r.waste_type] = 1;
      }
      totalLossLitres += Number(r.estimated_loss_litres) || 0;
    });

    res.json({
      success: true,
      reports,
      categoryCounts,
      totalLossLitres: Math.round(totalLossLitres)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/waste-reports', async (req, res) => {
  try {
    const { location, waste_type, description, reported_at, estimated_loss_litres, status, verified } = req.body;

    if (!location || !waste_type || !description) {
      return res.status(400).json({ success: false, error: 'Location, waste category, and description are required.' });
    }

    const db = await getDatabase();
    const stmt = db.prepare(`
      INSERT INTO water_waste_reports (location, waste_type, description, reported_at, estimated_loss_litres, status, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      location.trim(),
      waste_type,
      description.trim(),
      reported_at || new Date().toISOString(),
      Number(estimated_loss_litres) || 0,
      status || 'Reported',
      verified ? 1 : 0
    ]);
    stmt.free();
    persistDatabase();

    res.status(201).json({ success: true, message: 'Water waste incident reported.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/waste-reports/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, verified } = req.body;

    const db = await getDatabase();
    const existing = queryAll(db, `SELECT * FROM water_waste_reports WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Report not found.' });
    }

    const current = existing[0];
    const newStatus = status !== undefined ? status : current.status;
    const newVerified = verified !== undefined ? (verified ? 1 : 0) : current.verified;

    const stmt = db.prepare(`
      UPDATE water_waste_reports
      SET status = ?, verified = ?
      WHERE id = ?
    `);
    stmt.run([newStatus, newVerified, id]);
    stmt.free();
    persistDatabase();

    res.json({ success: true, message: 'Report updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Student Surveys
app.get('/api/surveys', async (req, res) => {
  try {
    const db = await getDatabase();
    const surveys = queryAll(db, `
      SELECT id, survey_date, total_responses, taps_running_count, long_showers_count, water_reuse_count, data_type
      FROM student_surveys
      ORDER BY id DESC
    `);

    // Separate actual vs illustrative
    const actualSurveys = surveys.filter(s => s.data_type === 'actual');
    const illustrativeSurveys = surveys.filter(s => s.data_type === 'illustrative');

    // Aggregate statistics
    function computeHabitStats(list: any[]) {
      if (list.length === 0) return null;
      const totalRespondents = list.reduce((acc, cur) => acc + cur.total_responses, 0);
      const tapsRunning = list.reduce((acc, cur) => acc + cur.taps_running_count, 0);
      const longShowers = list.reduce((acc, cur) => acc + cur.long_showers_count, 0);
      const waterReuse = list.reduce((acc, cur) => acc + cur.water_reuse_count, 0);

      return {
        totalRespondents,
        habits: [
          {
            key: 'taps_running',
            label: 'Leave taps running while washing hands or brushing',
            count: tapsRunning,
            total: totalRespondents,
            percentage: totalRespondents > 0 ? Number(((tapsRunning / totalRespondents) * 100).toFixed(1)) : 0,
            impact: 'Wastes approx 6-12 litres per instance',
            severity: 'high'
          },
          {
            key: 'long_showers',
            label: 'Take showers exceeding 10 minutes',
            count: longShowers,
            total: totalRespondents,
            percentage: totalRespondents > 0 ? Number(((longShowers / totalRespondents) * 100).toFixed(1)) : 0,
            impact: 'Consumes 15-20 litres per additional minute',
            severity: 'medium'
          },
          {
            key: 'water_reuse',
            label: 'Actively reuse rinse water for plants/cleaning',
            count: waterReuse,
            total: totalRespondents,
            percentage: totalRespondents > 0 ? Number(((waterReuse / totalRespondents) * 100).toFixed(1)) : 0,
            impact: 'Conserves 20-40 litres daily per household',
            severity: 'positive'
          }
        ]
      };
    }

    res.json({
      success: true,
      surveys,
      illustrativeSummary: computeHabitStats(illustrativeSurveys),
      actualSummary: computeHabitStats(actualSurveys),
      hasActualData: actualSurveys.length > 0
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/surveys', async (req, res) => {
  try {
    const { survey_date, total_responses, taps_running_count, long_showers_count, water_reuse_count, data_type } = req.body;

    const total = parseInt(total_responses);
    const taps = parseInt(taps_running_count);
    const showers = parseInt(long_showers_count);
    const reuse = parseInt(water_reuse_count);

    if (isNaN(total) || total <= 0) {
      return res.status(400).json({ success: false, error: 'Total responses must be a positive integer.' });
    }
    if (taps > total || showers > total || reuse > total) {
      return res.status(400).json({ success: false, error: 'Habit count cannot exceed the total number of respondents.' });
    }

    const db = await getDatabase();
    const stmt = db.prepare(`
      INSERT INTO student_surveys (survey_date, total_responses, taps_running_count, long_showers_count, water_reuse_count, data_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      survey_date || new Date().toISOString().split('T')[0],
      total,
      Math.max(0, taps || 0),
      Math.max(0, showers || 0),
      Math.max(0, reuse || 0),
      data_type === 'illustrative' ? 'illustrative' : 'actual'
    ]);
    stmt.free();
    persistDatabase();

    res.status(201).json({ success: true, message: 'Survey response added successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Water Conservation Recommendations & Actions
app.get('/api/recommendations', async (req, res) => {
  try {
    const db = await getDatabase();

    // Check current state to generate dynamic rule-based suggestions:
    // Rule A: Leaking taps count
    const activeLeaks = queryAll(db, `
      SELECT COUNT(*) as count FROM water_waste_reports 
      WHERE (waste_type LIKE '%leak%' OR waste_type = 'Leaking taps') AND status != 'Resolved'
    `)[0]?.count || 0;

    // Rule B: Washroom consumption spike
    const washroomUsage = queryAll(db, `
      SELECT SUM(litres_used) as total FROM water_usage WHERE location LIKE '%washroom%'
    `)[0]?.total || 0;

    // Rule C: Garden usage
    const gardenReports = queryAll(db, `
      SELECT COUNT(*) as count FROM water_waste_reports WHERE waste_type = 'Excessive garden watering'
    `)[0]?.count || 0;

    // Rule D: Overflow incidents
    const overflowReports = queryAll(db, `
      SELECT COUNT(*) as count FROM water_waste_reports WHERE waste_type = 'Overflow and spillage' AND status != 'Resolved'
    `)[0]?.count || 0;

    // Rule E: Recent usage records
    const recentRecords = queryAll(db, `SELECT COUNT(*) as count FROM water_usage`)[0]?.count || 0;

    // Database stored conservation actions
    const dbActions = queryAll(db, `SELECT * FROM conservation_actions ORDER BY status ASC, priority DESC`);

    // Dynamic rule insights
    const dynamicInsights: any[] = [];

    if (activeLeaks > 0) {
      dynamicInsights.push({
        issue: `${activeLeaks} active leaking tap${activeLeaks > 1 ? 's' : ''} detected`,
        recommendation: 'Prioritize plumbing inspection and replace damaged washers immediately to stop ongoing water loss.',
        priority: 'High',
        trigger: 'active_leaks'
      });
    }

    if (washroomUsage > 1500) {
      dynamicInsights.push({
        issue: 'Washrooms represent over 40% of total facility water usage',
        recommendation: 'Inspect auto-shutoff sensors, check for concealed flush valve leakage, and mount reminder signage.',
        priority: 'High',
        trigger: 'high_washroom_consumption'
      });
    }

    if (gardenReports > 0) {
      dynamicInsights.push({
        issue: 'Reports of excessive garden watering or midday irrigation',
        recommendation: 'Review watering schedules, switch to drip irrigation, and restrict watering to before 08:00 AM.',
        priority: 'Medium',
        trigger: 'garden_watering'
      });
    }

    if (overflowReports > 0) {
      dynamicInsights.push({
        issue: `${overflowReports} unresolved overflow or basin spillage report${overflowReports > 1 ? 's' : ''}`,
        recommendation: 'Improve drinking-water station drainage and install splash guards to prevent slippage and wastage.',
        priority: 'Medium',
        trigger: 'spillage_reports'
      });
    }

    if (recentRecords < 7) {
      dynamicInsights.push({
        issue: 'Less than 7 days of consecutive water measurements recorded',
        recommendation: 'Collect daily water sub-meter readings for a full week to establish a reliable baseline before judging savings.',
        priority: 'High',
        trigger: 'insufficient_baseline'
      });
    }

    res.json({
      success: true,
      actions: dbActions,
      dynamicInsights
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/recommendations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    const db = await getDatabase();
    const stmt = db.prepare(`
      UPDATE conservation_actions 
      SET status = ?, completed_at = ?
      WHERE id = ?
    `);
    const completedAt = status === 'Completed' ? new Date().toISOString() : null;
    stmt.run([status, completedAt, id]);
    stmt.free();
    persistDatabase();

    res.json({ success: true, message: 'Action status updated.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/recommendations', async (req, res) => {
  try {
    const { action_title, description, priority, status } = req.body;
    if (!action_title || !description) {
      return res.status(400).json({ success: false, error: 'Title and description are required.' });
    }

    const db = await getDatabase();
    const stmt = db.prepare(`
      INSERT INTO conservation_actions (action_title, description, priority, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run([
      action_title.trim(),
      description.trim(),
      priority || 'Medium',
      status || 'Pending',
      new Date().toISOString()
    ]);
    stmt.free();
    persistDatabase();

    res.status(201).json({ success: true, message: 'Conservation action logged.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Conservation Score
app.get('/api/conservation-score', async (req, res) => {
  try {
    const db = await getDatabase();
    const scoreData = calculateConservationScore(db);
    res.json({ success: true, ...scoreData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Inspection Records
app.get('/api/inspections', async (req, res) => {
  try {
    const db = await getDatabase();
    const inspections = queryAll(db, `SELECT * FROM inspection_records ORDER BY inspection_date DESC, id DESC`);
    res.json({ success: true, inspections });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/inspections', async (req, res) => {
  try {
    const { location, inspection_date, leaks_found, leaks_resolved, notes } = req.body;
    if (!location) {
      return res.status(400).json({ success: false, error: 'Location is required.' });
    }

    const db = await getDatabase();
    const stmt = db.prepare(`
      INSERT INTO inspection_records (location, inspection_date, leaks_found, leaks_resolved, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run([
      location.trim(),
      inspection_date || new Date().toISOString().split('T')[0],
      parseInt(leaks_found) || 0,
      parseInt(leaks_resolved) || 0,
      notes ? notes.trim() : ''
    ]);
    stmt.free();
    persistDatabase();

    res.status(201).json({ success: true, message: 'Inspection record saved.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// VITE DEV SERVER / STATIC PRODUCTION SERVER
// -------------------------------------------------------------
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AquaWatch server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
