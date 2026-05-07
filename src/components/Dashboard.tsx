import React, { useState, useEffect } from 'react';
import { useAppStore, Theme } from '../store/useAppStore';
import AuthScreen from './AuthScreen';
import Calculator from './Calculator';
import DrugBank from './DrugBank';
import AuditLogTab from './AuditLogTab';
import Prescription from './Prescription';
import { LogOut, Cloud, CloudOff, Calculator as CalcIcon, Database, FileText, Palette, Sun, Moon, Flower2, Printer } from 'lucide-react';
import { cn } from '../lib/utils';
import { isSupabaseConfigured } from '../lib/supabase';

type Tab = 'calc' | 'drugs' | 'logs' | 'resep';

export default function Dashboard() {
  const user = useAppStore(state => state.user);
  const isSyncing = useAppStore(state => state.isSyncing);
  const syncWithCloud = useAppStore(state => state.syncWithCloud);
  const localLogout = useAppStore(state => state.localLogout);
  const theme = useAppStore(state => state.theme);
  const setTheme = useAppStore(state => state.setTheme);
  
  const [activeTab, setActiveTab] = useState<Tab>('calc');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
     const handleOnline = () => {
         setIsOnline(true);
         syncWithCloud();
     };
     const handleOffline = () => setIsOnline(false);

     window.addEventListener('online', handleOnline);
     window.addEventListener('offline', handleOffline);

     // Initial sync if online
     if (navigator.onLine) {
        syncWithCloud();
     }

     return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
     };
  }, [syncWithCloud]);

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       {/* Header */}
       <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm shadow-slate-100">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                   <span className="font-black text-lg tracking-tighter leading-none">CDSS</span>
                </div>
                <div className="hidden sm:block">
                   <p className="text-sm font-bold text-slate-800">dr. {user.username}</p>
                   <p className="text-xs text-slate-500">ID: {user.id.substring(0,8)}</p>
                </div>
             </div>

             <div className="flex items-center gap-4">
                {/* Theme Selector */}
                <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl">
                  <button 
                    onClick={() => setTheme('light')}
                    className={cn("px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all", theme === 'light' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                  >
                    <Sun className="w-3.5 h-3.5" /> Normal
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={cn("px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all", theme === 'dark' ? "bg-slate-800 text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                  >
                    <Moon className="w-3.5 h-3.5" /> Malam
                  </button>
                  <button 
                    onClick={() => setTheme('pink')}
                    className={cn("px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all", theme === 'pink' ? "bg-pink-100 text-pink-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                  >
                    <Flower2 className="w-3.5 h-3.5" /> Pink
                  </button>
                </div>

                {/* Sync Status */}
                <div className={cn(
                   "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors",
                   isOnline ? (isSyncing ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600") : "bg-slate-100 text-slate-500"
                )}>
                   {isOnline ? (
                      isSyncing ? <Cloud className="w-4 h-4 animate-pulse" /> : <Cloud className="w-4 h-4" />
                   ) : (
                      <CloudOff className="w-4 h-4" />
                   )}
                   <span className="hidden sm:inline">
                      {isOnline ? (isSyncing ? "Syncing..." : (isSupabaseConfigured ? "Synced" : "Offline Mode")) : "Offline"}
                   </span>
                </div>

                <button onClick={localLogout} className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors">
                   <LogOut className="w-5 h-5" />
                </button>
             </div>
          </div>
       </header>

       {/* Main Navigation */}
       <div className="bg-white border-b border-slate-200 relative z-20">
          <div className="max-w-5xl mx-auto px-4 flex gap-6 overflow-x-auto no-scrollbar">
             <NavTab active={activeTab === 'calc'} onClick={() => setActiveTab('calc')} icon={<CalcIcon className="w-4 h-4" />} label="Kalkulator" />
             <NavTab active={activeTab === 'resep'} onClick={() => setActiveTab('resep')} icon={<Printer className="w-4 h-4" />} label="Cetak Resep" />
             <NavTab active={activeTab === 'drugs'} onClick={() => setActiveTab('drugs')} icon={<Database className="w-4 h-4" />} label="Drug Bank" />
             <NavTab active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<FileText className="w-4 h-4" />} label="Audit Log" />
          </div>
       </div>

       {/* Content Area */}
       <main className="flex-1 max-w-5xl md:mx-auto w-full p-4 lg:p-8">
          {activeTab === 'calc' && <Calculator />}
          {activeTab === 'resep' && <Prescription />}
          {activeTab === 'drugs' && <DrugBank />}
          {activeTab === 'logs' && <AuditLogTab />}
       </main>
    </div>
  )
}

function NavTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
   return (
      <button 
         onClick={onClick}
         className={cn(
            "flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
            active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
         )}
      >
         {icon}
         {label}
      </button>
   )
}
