import React, { useState } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  Filter,
  CheckCircle,
  Zap,
  Info
} from 'lucide-react';
import { ConservationAction, DynamicInsight } from '../types.ts';
import { updateActionStatus, createAction } from '../services/api.ts';

interface RecommendationsProps {
  actions: ConservationAction[];
  dynamicInsights: DynamicInsight[];
  onRefresh: () => void;
}

export const Recommendations: React.FC<RecommendationsProps> = ({
  actions,
  dynamicInsights,
  onRefresh,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      setUpdatingId(id);
      const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
      await updateActionStatus(id, nextStatus);
      onRefresh();
    } catch (err) {
      console.error('Failed to update action status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    try {
      setIsSubmitting(true);
      await createAction({
        action_title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
      });
      setNewTitle('');
      setNewDesc('');
      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to add action:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredActions = actions.filter((act) => {
    const matchesPriority = priorityFilter === 'all' || act.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || act.status === statusFilter;
    return matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Dynamic Rule-Based Diagnostic Engine */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#1677C8]" />
            <h3 className="text-sm font-bold text-slate-900">
              Automated Data-Driven Recommendations
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Real-time Rule Engine
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Actions dynamically triggered by your facility sub-meters, reported leaks, and baseline completeness.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dynamicInsights.map((insight, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {insight.issue}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      insight.priority === 'High'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {insight.priority} Priority
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {insight.recommendation}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Trigger: {insight.trigger}</span>
                <span className="text-[#1677C8] font-medium">Direct Action Recommended</span>
              </div>
            </div>
          ))}

          {dynamicInsights.length === 0 && (
            <div className="col-span-2 p-6 text-center text-xs text-slate-400">
              No anomalies detected. All facility flow rates and leak resolution rates are nominal!
            </div>
          )}
        </div>
      </div>

      {/* Action Plan Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Header & Filter Bar */}
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Facility Conservation Action Plan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Track planned and completed water-saving engineering and behavioral initiatives.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 text-xs focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 text-xs focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1677C8] hover:bg-[#125ea0] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Action</span>
            </button>
          </div>
        </div>

        {/* Action Items List */}
        <div className="divide-y divide-slate-100">
          {filteredActions.map((action) => {
            const isCompleted = action.status === 'Completed';
            const isUpdating = updatingId === action.id;

            return (
              <div
                key={action.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  isCompleted ? 'bg-slate-50/50' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleToggleStatus(action.id, action.status)}
                    className="mt-0.5 p-0.5 text-slate-400 hover:text-[#43A66B] transition-colors"
                    title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-[#43A66B]" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-[#43A66B]" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-xs font-bold ${
                          isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {action.action_title}
                      </h4>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          action.priority === 'High'
                            ? 'bg-rose-50 text-rose-700'
                            : action.priority === 'Medium'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {action.priority}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-normal">
                      {action.description}
                    </p>

                    <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-2">
                      <span>Logged: {new Date(action.created_at).toLocaleDateString()}</span>
                      {action.completed_at && (
                        <>
                          <span>·</span>
                          <span className="text-[#43A66B] font-medium">
                            Completed: {new Date(action.completed_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleToggleStatus(action.id, action.status)}
                  className={`text-xs font-semibold px-3 py-1 rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                    isCompleted
                      ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  {isCompleted ? 'Reopen' : 'Mark Done'}
                </button>
              </div>
            );
          })}

          {filteredActions.length === 0 && (
            <div className="p-12 text-center text-xs text-slate-400">
              No actions found for the selected filter.
            </div>
          )}
        </div>
      </div>

      {/* Verification Rigor Safeguard */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-[#1677C8] shrink-0" />
        <span>
          <strong>Scientific Principle:</strong> Do not claim that an action has saved water unless supporting measurements (before vs. after meter logs) are recorded in the database.
        </span>
      </div>

      {/* Add Action Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#12304A] text-white flex items-center justify-between">
              <h3 className="text-sm font-semibold">Add Conservation Action</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddAction} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Action Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Install Pressure Reducers in Cafeteria"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1677C8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specify equipment, target fixtures, or behavioral goals..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1677C8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none bg-white"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1677C8] rounded-lg disabled:opacity-50"
                >
                  Save Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
