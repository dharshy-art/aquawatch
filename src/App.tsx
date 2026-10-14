import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, PageId } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DashboardOverview } from './pages/DashboardOverview.tsx';
import { ConsumptionAnalytics } from './pages/ConsumptionAnalytics.tsx';
import { WasteDetection } from './pages/WasteDetection.tsx';
import { StudentHabits } from './pages/StudentHabits.tsx';
import { Recommendations } from './pages/Recommendations.tsx';
import { Inspections } from './pages/Inspections.tsx';
import { ScoreExplanation } from './pages/ScoreExplanation.tsx';

import { ReportWasteModal } from './components/ReportWasteModal.tsx';
import { RecordUsageModal } from './components/RecordUsageModal.tsx';
import { RecordSurveyModal } from './components/RecordSurveyModal.tsx';
import { RecordInspectionModal } from './components/RecordInspectionModal.tsx';
import { ScoreDetailsModal } from './components/ScoreDetailsModal.tsx';

import {
  fetchDashboard,
  fetchWaterUsage,
  fetchWasteReports,
  fetchSurveys,
  fetchRecommendations,
  fetchInspections,
} from './services/api.ts';

import {
  KPIData,
  DailyTrendPoint,
  LocationUsage,
  BeforeAfterComparison,
  WaterUsageRecord,
  WasteReport,
  StudentSurveyRecord,
  SurveySummary,
  ConservationAction,
  DynamicInsight,
  InspectionRecord
} from './types.ts';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('overview');

  // Data states
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [dailyTrend, setDailyTrend] = useState<DailyTrendPoint[]>([]);
  const [byLocation, setByLocation] = useState<LocationUsage[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [comparison, setComparison] = useState<BeforeAfterComparison | null>(null);
  const [records, setRecords] = useState<WaterUsageRecord[]>([]);

  const [wasteReports, setWasteReports] = useState<WasteReport[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [totalLossLitres, setTotalLossLitres] = useState<number>(0);

  const [surveys, setSurveys] = useState<StudentSurveyRecord[]>([]);
  const [actualSummary, setActualSummary] = useState<SurveySummary | null>(null);
  const [illustrativeSummary, setIllustrativeSummary] = useState<SurveySummary | null>(null);
  const [hasActualData, setHasActualData] = useState<boolean>(false);

  const [actions, setActions] = useState<ConservationAction[]>([]);
  const [dynamicInsights, setDynamicInsights] = useState<DynamicInsight[]>([]);

  const [inspections, setInspections] = useState<InspectionRecord[]>([]);

  // Filter states
  const [daysFilter, setDaysFilter] = useState<number>(14);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [dataTypeFilter, setDataTypeFilter] = useState<string>('all');

  // UI modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  // Loading & error states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    try {
      setLoadError(null);
      const [dashRes, usageRes, wasteRes, surveyRes, recoRes, insRes] = await Promise.all([
        fetchDashboard(),
        fetchWaterUsage({ days: daysFilter, location: locationFilter, data_type: dataTypeFilter }),
        fetchWasteReports(),
        fetchSurveys(),
        fetchRecommendations(),
        fetchInspections(),
      ]);

      if (dashRes.success) setKpis(dashRes.kpis);
      if (usageRes.success) {
        setDailyTrend(usageRes.dailyTrend);
        setByLocation(usageRes.byLocation);
        setAvailableLocations(usageRes.availableLocations);
        setComparison(usageRes.comparison);
        setRecords(usageRes.records);
      }
      if (wasteRes.success) {
        setWasteReports(wasteRes.reports);
        setCategoryCounts(wasteRes.categoryCounts);
        setTotalLossLitres(wasteRes.totalLossLitres);
      }
      if (surveyRes.success) {
        setSurveys(surveyRes.surveys);
        setActualSummary(surveyRes.actualSummary);
        setIllustrativeSummary(surveyRes.illustrativeSummary);
        setHasActualData(surveyRes.hasActualData);
      }
      if (recoRes.success) {
        setActions(recoRes.actions);
        setDynamicInsights(recoRes.dynamicInsights);
      }
      if (insRes.success) {
        setInspections(insRes.inspections);
      }
    } catch (err: any) {
      console.error('Data loading error:', err);
      setLoadError(err.message || 'Failed to communicate with AquaWatch backend.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [daysFilter, locationFilter, dataTypeFilter]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAllData();
  };

  const getPageTitle = (page: PageId) => {
    switch (page) {
      case 'overview':
        return 'Executive Overview';
      case 'analytics':
        return 'Water Consumption Analytics';
      case 'waste':
        return 'Water Waste Detection & Leak Tracking';
      case 'surveys':
        return 'Student Habits & Survey Analytics';
      case 'recommendations':
        return 'Conservation Actions & Recommendations';
      case 'inspections':
        return 'Facility Plumbing Inspection Records';
      case 'score':
        return 'Water Conservation Scoring Index';
      default:
        return 'Dashboard';
    }
  };

  const unresolvedWasteCount = wasteReports.filter((r) => r.status !== 'Resolved').length;
  const pendingActionsCount = actions.filter((a) => a.status !== 'Completed').length;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        unresolvedWasteCount={unresolvedWasteCount}
        pendingActionsCount={pendingActionsCount}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          activePageTitle={getPageTitle(activePage)}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onOpenRecordModal={() => setIsRecordModalOpen(true)}
          onRefreshData={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {loadError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loadError}</span>
              </div>
              <button
                onClick={handleRefresh}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded font-semibold text-red-800 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-80 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#1677C8]" />
              <span className="text-xs font-semibold text-slate-500">
                Initializing AquaWatch SQLite database and records...
              </span>
            </div>
          ) : (
            <>
              {activePage === 'overview' && (
                <DashboardOverview
                  kpis={kpis}
                  dailyTrend={dailyTrend}
                  comparison={comparison}
                  wasteReports={wasteReports}
                  dynamicInsights={dynamicInsights}
                  onNavigate={setActivePage}
                  onOpenReportModal={() => setIsReportModalOpen(true)}
                  onOpenScoreDetails={() => setIsScoreModalOpen(true)}
                />
              )}

              {activePage === 'analytics' && (
                <ConsumptionAnalytics
                  dailyTrend={dailyTrend}
                  byLocation={byLocation}
                  availableLocations={availableLocations}
                  comparison={comparison}
                  records={records}
                  daysFilter={daysFilter}
                  locationFilter={locationFilter}
                  dataTypeFilter={dataTypeFilter}
                  onChangeDays={setDaysFilter}
                  onChangeLocation={setLocationFilter}
                  onChangeDataType={setDataTypeFilter}
                  onOpenRecordModal={() => setIsRecordModalOpen(true)}
                />
              )}

              {activePage === 'waste' && (
                <WasteDetection
                  reports={wasteReports}
                  categoryCounts={categoryCounts}
                  totalLossLitres={totalLossLitres}
                  onOpenReportModal={() => setIsReportModalOpen(true)}
                  onRefresh={handleRefresh}
                />
              )}

              {activePage === 'surveys' && (
                <StudentHabits
                  surveys={surveys}
                  actualSummary={actualSummary}
                  illustrativeSummary={illustrativeSummary}
                  hasActualData={hasActualData}
                  onOpenSurveyModal={() => setIsSurveyModalOpen(true)}
                />
              )}

              {activePage === 'recommendations' && (
                <Recommendations
                  actions={actions}
                  dynamicInsights={dynamicInsights}
                  onRefresh={handleRefresh}
                />
              )}

              {activePage === 'inspections' && (
                <Inspections
                  inspections={inspections}
                  onOpenInspectionModal={() => setIsInspectionModalOpen(true)}
                />
              )}

              {activePage === 'score' && (
                <ScoreExplanation
                  score={kpis?.conservationScore.score ?? null}
                  status={kpis?.conservationScore.status ?? 'Measured'}
                  grade={kpis?.conservationScore.grade ?? 'Evaluating'}
                  indicators={kpis?.conservationScore.indicators ?? []}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <ReportWasteModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <RecordUsageModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <RecordSurveyModal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <RecordInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        onSuccess={handleRefresh}
      />

      {kpis && (
        <ScoreDetailsModal
          isOpen={isScoreModalOpen}
          onClose={() => setIsScoreModalOpen(false)}
          score={kpis.conservationScore.score}
          status={kpis.conservationScore.status}
          grade={kpis.conservationScore.grade}
          indicators={kpis.conservationScore.indicators}
        />
      )}
    </div>
  );
}
