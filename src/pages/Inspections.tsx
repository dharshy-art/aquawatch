import React from 'react';
import { ClipboardCheck, PlusCircle, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { InspectionRecord } from '../types.ts';

interface InspectionsProps {
  inspections: InspectionRecord[];
  onOpenInspectionModal: () => void;
}

export const Inspections: React.FC<InspectionsProps> = ({
  inspections,
  onOpenInspectionModal,
}) => {
  const totalFound = inspections.reduce((acc, cur) => acc + cur.leaks_found, 0);
  const totalResolved = inspections.reduce((acc, cur) => acc + cur.leaks_resolved, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Audits Completed
            </span>
            <ClipboardCheck className="w-4 h-4 text-[#1677C8]" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {inspections.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Routine zone checks logged
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Leaks Identified
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-600">
            {totalFound}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Discovered during fixture inspections
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Leaks Repaired On-Site
            </span>
            <ShieldCheck className="w-4 h-4 text-[#43A66B]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#43A66B]">
            {totalResolved}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Immediate washer/valve replacements
          </span>
        </div>
      </div>

      {/* Main Inspection Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Facility Plumbing Inspection Log
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Audits performed by facility maintenance staff, environmental club, or teachers.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenInspectionModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#1677C8] hover:bg-[#125ea0] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Inspection</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Inspection Date</th>
                <th className="py-3 px-4">Zone / Location</th>
                <th className="py-3 px-4 text-center">Leaks Found</th>
                <th className="py-3 px-4 text-center">Leaks Resolved</th>
                <th className="py-3 px-4">Audit Findings & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inspections.map((ins) => (
                <tr key={ins.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                    {ins.inspection_date}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {ins.location}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-medium text-amber-600">
                    {ins.leaks_found}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-[#43A66B]">
                    {ins.leaks_resolved}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-md">
                    {ins.notes || 'Routine check nominal.'}
                  </td>
                </tr>
              ))}

              {inspections.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    No inspection records logged yet. Click &ldquo;Log Inspection&rdquo; to add your first audit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
