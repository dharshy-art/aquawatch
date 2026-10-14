import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'aquawatch.sqlite');

let dbInstance: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
    initSchema(dbInstance);
    seedInitialData(dbInstance);
    persistDatabase();
  }

  return dbInstance;
}

export function persistDatabase(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS water_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      litres_used REAL NOT NULL,
      measurement_method TEXT NOT NULL,
      data_type TEXT NOT NULL DEFAULT 'illustrative'
    );

    CREATE TABLE IF NOT EXISTS water_waste_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location TEXT NOT NULL,
      waste_type TEXT NOT NULL,
      description TEXT NOT NULL,
      reported_at TEXT NOT NULL,
      estimated_loss_litres REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Reported',
      verified INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS student_surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_date TEXT NOT NULL,
      total_responses INTEGER NOT NULL,
      taps_running_count INTEGER NOT NULL,
      long_showers_count INTEGER NOT NULL,
      water_reuse_count INTEGER NOT NULL,
      data_type TEXT NOT NULL DEFAULT 'illustrative'
    );

    CREATE TABLE IF NOT EXISTS conservation_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_title TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Medium',
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS inspection_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location TEXT NOT NULL,
      inspection_date TEXT NOT NULL,
      leaks_found INTEGER NOT NULL DEFAULT 0,
      leaks_resolved INTEGER NOT NULL DEFAULT 0,
      notes TEXT
    );
  `);
}

function seedInitialData(db: Database) {
  // Baseline and recent daily usage for last 14 days (illustrative)
  const today = new Date();
  
  const usageStmt = db.prepare(`
    INSERT INTO water_usage (date, location, litres_used, measurement_method, data_type)
    VALUES (?, ?, ?, ?, ?)
  `);

  const locations = [
    { name: 'Washrooms', baseline: 650, current: 480 },
    { name: 'Kitchen & Cafeteria', baseline: 420, current: 360 },
    { name: 'Garden & Grounds', baseline: 380, current: 220 },
    { name: 'Drinking Water Station', baseline: 190, current: 140 },
    { name: 'Laboratory & Cleaning', baseline: 160, current: 130 }
  ];

  // Past 14 days: first 7 days baseline period, next 7 days conservation period
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isBaseline = i >= 7;

    locations.forEach(loc => {
      // Natural variation +- 8%
      const baseVal = isBaseline ? loc.baseline : loc.current;
      const variation = (Math.sin(i * 1.5 + loc.name.length) * 0.08);
      const litres = Math.round(baseVal * (1 + variation));
      usageStmt.run([
        dateStr,
        loc.name,
        litres,
        'Smart Sub-meter Sensor',
        'illustrative'
      ]);
    });
  }
  usageStmt.free();

  // Water waste reports (clearly marked illustrative)
  const wasteStmt = db.prepare(`
    INSERT INTO water_waste_reports (location, waste_type, description, reported_at, estimated_loss_litres, status, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const d1 = new Date(today); d1.setDate(d1.getDate() - 1);
  const d2 = new Date(today); d2.setDate(d2.getDate() - 3);
  const d3 = new Date(today); d3.setDate(d3.getDate() - 5);
  const d4 = new Date(today); d4.setDate(d4.getDate() - 7);

  wasteStmt.run(['2nd Floor West Washroom', 'Leaking taps', 'Steady cold tap drip in basin #3 (approx 20 drops/min)', d1.toISOString(), 35, 'In Progress', 1]);
  wasteStmt.run(['Sports Ground Spigot', 'Taps left running', 'Hose bib partially left open after garden upkeep', d2.toISOString(), 120, 'Resolved', 1]);
  wasteStmt.run(['Science Lab Sink #2', 'Leaking taps', 'Unconfirmed drip reported by student monitor', d3.toISOString(), 15, 'Reported', 0]);
  wasteStmt.run(['Cafeteria Dish Pit', 'Overflow and spillage', 'Rinse station drain back-pressure causing wash overflow', d4.toISOString(), 80, 'Resolved', 1]);
  wasteStmt.free();

  // Illustrative student survey data as specified in Section 7:
  // "Leave taps running: 12 out of 20 (60%), Take long showers: 8 out of 20 (40%), Reuse water: 6 out of 20 (30%)"
  const surveyStmt = db.prepare(`
    INSERT INTO student_surveys (survey_date, total_responses, taps_running_count, long_showers_count, water_reuse_count, data_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const surveyDate = new Date(today); surveyDate.setDate(surveyDate.getDate() - 4);
  surveyStmt.run([
    surveyDate.toISOString().split('T')[0],
    20,
    12, // 60%
    8,  // 40%
    6,  // 30%
    'illustrative'
  ]);
  surveyStmt.free();

  // Conservation actions
  const actionStmt = db.prepare(`
    INSERT INTO conservation_actions (action_title, description, priority, status, created_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  actionStmt.run([
    'Repair Basin #3 Washroom Faucet',
    'Replace worn rubber gasket and ceramic washer to eliminate 35L/day leak.',
    'High',
    'Pending',
    d1.toISOString(),
    null
  ]);
  actionStmt.run([
    'Install Timed Aerators in Student Washrooms',
    'Fit 1.5 GPM pressure-compensating flow aerators across all 12 washroom sinks.',
    'High',
    'Completed',
    d4.toISOString(),
    d2.toISOString()
  ]);
  actionStmt.run([
    'Optimize School Grounds Sprinkler Timers',
    'Shift irrigation schedule to early morning (05:30) to reduce evaporation loss by 40%.',
    'Medium',
    'Completed',
    d3.toISOString(),
    d1.toISOString()
  ]);
  actionStmt.run([
    'Conduct Grade 7-9 Water Habit Workshop',
    'Address survey finding showing 60% of students leave taps running while washing hands.',
    'Medium',
    'Pending',
    d2.toISOString(),
    null
  ]);
  actionStmt.free();

  // Inspection records
  const inspectStmt = db.prepare(`
    INSERT INTO inspection_records (location, inspection_date, leaks_found, leaks_resolved, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  inspectStmt.run(['Main Building Washrooms', d3.toISOString().split('T')[0], 2, 1, 'Audited 14 fixtures. Found 1 gasket wear and 1 flush valve float misaligned.']);
  inspectStmt.run(['Garden & Grounds Irrigation', d2.toISOString().split('T')[0], 1, 1, 'Inspected drip lines and spigots. Replaced cracked connector near greenhouse.']);
  inspectStmt.run(['Cafeteria & Kitchen Scullery', d1.toISOString().split('T')[0], 1, 1, 'Checked grease traps and pre-rinse spray valves. Replaced worn spray head.']);
  inspectStmt.free();
}
