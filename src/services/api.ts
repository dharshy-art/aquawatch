import {
  KPIData,
  DailyTrendPoint,
  LocationUsage,
  BeforeAfterComparison,
  WaterUsageRecord,
  WasteReport,
  SurveySummary,
  StudentSurveyRecord,
  ConservationAction,
  DynamicInsight,
  InspectionRecord
} from '../types.ts';

const BASE_URL = '/api';

export async function fetchDashboard(): Promise<{ success: boolean; kpis: KPIData; latestDate: string | null }> {
  const res = await fetch(`${BASE_URL}/dashboard`);
  if (!res.ok) throw new Error('Failed to load dashboard KPIs');
  return res.json();
}

export async function fetchWaterUsage(options?: { days?: number; location?: string; data_type?: string }): Promise<{
  success: boolean;
  dailyTrend: DailyTrendPoint[];
  byLocation: LocationUsage[];
  availableLocations: string[];
  comparison: BeforeAfterComparison;
  records: WaterUsageRecord[];
}> {
  const params = new URLSearchParams();
  if (options?.days) params.set('days', options.days.toString());
  if (options?.location) params.set('location', options.location);
  if (options?.data_type) params.set('data_type', options.data_type);

  const res = await fetch(`${BASE_URL}/water-usage?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load water consumption analytics');
  return res.json();
}

export async function createWaterUsage(data: {
  date: string;
  location: string;
  litres_used: number;
  measurement_method: string;
  data_type: 'actual' | 'illustrative';
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/water-usage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit measurement');
  }
  return res.json();
}

export async function fetchWasteReports(): Promise<{
  success: boolean;
  reports: WasteReport[];
  categoryCounts: Record<string, number>;
  totalLossLitres: number;
}> {
  const res = await fetch(`${BASE_URL}/waste-reports`);
  if (!res.ok) throw new Error('Failed to load waste reports');
  return res.json();
}

export async function createWasteReport(data: {
  location: string;
  waste_type: string;
  description: string;
  reported_at?: string;
  estimated_loss_litres?: number;
  status?: string;
  verified?: boolean;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/waste-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit waste report');
  }
  return res.json();
}

export async function updateWasteReport(
  id: number,
  data: { status?: string; verified?: boolean }
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/waste-reports/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update report status');
  return res.json();
}

export async function fetchSurveys(): Promise<{
  success: boolean;
  surveys: StudentSurveyRecord[];
  actualSummary: SurveySummary | null;
  illustrativeSummary: SurveySummary | null;
  hasActualData: boolean;
}> {
  const res = await fetch(`${BASE_URL}/surveys`);
  if (!res.ok) throw new Error('Failed to load student surveys');
  return res.json();
}

export async function createSurvey(data: {
  survey_date: string;
  total_responses: number;
  taps_running_count: number;
  long_showers_count: number;
  water_reuse_count: number;
  data_type: 'actual' | 'illustrative';
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/surveys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit survey');
  }
  return res.json();
}

export async function fetchRecommendations(): Promise<{
  success: boolean;
  actions: ConservationAction[];
  dynamicInsights: DynamicInsight[];
}> {
  const res = await fetch(`${BASE_URL}/recommendations`);
  if (!res.ok) throw new Error('Failed to load recommendations');
  return res.json();
}

export async function updateActionStatus(
  id: number,
  status: 'Pending' | 'Completed'
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/recommendations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update action');
  return res.json();
}

export async function createAction(data: {
  action_title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add action');
  return res.json();
}

export async function fetchInspections(): Promise<{
  success: boolean;
  inspections: InspectionRecord[];
}> {
  const res = await fetch(`${BASE_URL}/inspections`);
  if (!res.ok) throw new Error('Failed to load inspection records');
  return res.json();
}

export async function createInspection(data: {
  location: string;
  inspection_date: string;
  leaks_found: number;
  leaks_resolved: number;
  notes: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/inspections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save inspection');
  return res.json();
}
