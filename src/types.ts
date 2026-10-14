export interface KPIData {
  totalConsumption: {
    value: number;
    unit: string;
    previousValue: number | null;
    trendPercent: number | null;
    tooltip: string;
  };
  waterSaved: {
    value: number;
    unit: string;
    percentageReduction: number | null;
    baselineDailyAvg: number;
    currentDailyAvg: number;
    tooltip: string;
  };
  leaksDetected: {
    activeCount: number;
    verifiedCount: number;
    resolvedCount: number;
    totalReported: number;
    unit: string;
    tooltip: string;
  };
  conservationScore: {
    score: number | null;
    status: string;
    grade: string;
    indicators: ScoreIndicator[];
    unit: string;
    tooltip: string;
  };
}

export interface ScoreIndicator {
  name: string;
  weight: number;
  achieved: number;
  details?: string;
  status?: string;
}

export interface WaterUsageRecord {
  id: number;
  date: string;
  location: string;
  litres_used: number;
  measurement_method: string;
  data_type: 'actual' | 'illustrative';
}

export interface DailyTrendPoint {
  date: string;
  total_litres: number;
}

export interface LocationUsage {
  location: string;
  total_litres: number;
  measurements_count: number;
}

export interface BeforeAfterComparison {
  hasComparison: boolean;
  baselinePeriod: string;
  currentPeriod: string;
  baselineAvg: number;
  currentAvg: number;
  litresSaved: number;
  percentageReduction: number;
  status: string;
}

export interface WasteReport {
  id: number;
  location: string;
  waste_type: 'Leaking taps' | 'Taps left running' | 'Excessive garden watering' | 'Overflow and spillage' | string;
  description: string;
  reported_at: string;
  estimated_loss_litres: number;
  status: 'Reported' | 'In Progress' | 'Resolved';
  verified: number; // 0 or 1
}

export interface SurveyHabit {
  key: string;
  label: string;
  count: number;
  total: number;
  percentage: number;
  impact: string;
  severity: 'high' | 'medium' | 'positive';
}

export interface SurveySummary {
  totalRespondents: number;
  habits: SurveyHabit[];
}

export interface StudentSurveyRecord {
  id: number;
  survey_date: string;
  total_responses: number;
  taps_running_count: number;
  long_showers_count: number;
  water_reuse_count: number;
  data_type: 'actual' | 'illustrative';
}

export interface ConservationAction {
  id: number;
  action_title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed';
  created_at: string;
  completed_at: string | null;
}

export interface DynamicInsight {
  issue: string;
  recommendation: string;
  priority: 'High' | 'Medium' | 'Low';
  trigger: string;
}

export interface InspectionRecord {
  id: number;
  location: string;
  inspection_date: string;
  leaks_found: number;
  leaks_resolved: number;
  notes: string;
}
