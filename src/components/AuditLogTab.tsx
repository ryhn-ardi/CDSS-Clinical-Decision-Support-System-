import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Clock, Activity } from 'lucide-react';

export default function AuditLogTab() {
  const auditLogs = useAppStore(state => state.auditLogs);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
       <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-bold text-slate-800">Audit Log Medis</h2>
       </div>
       <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
               Belum ada rekam aktivitas.
            </div>
          ) : (
            auditLogs.map(log => (
              <div key={log.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                 <div className="mt-0.5">
                   <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Activity className="w-4 h-4" />
                   </div>
                 </div>
                 <div>
                    <p className="text-sm font-semibold text-slate-800">{log.action}</p>
                    <p className="text-sm text-slate-600 mt-0.5 max-w-xl">{log.details}</p>
                    <p className="text-xs text-slate-400 mt-1.5 font-mono">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </p>
                 </div>
              </div>
            ))
          )}
       </div>
    </div>
  )
}
