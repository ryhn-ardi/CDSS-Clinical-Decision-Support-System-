import React, { useState, useMemo } from 'react';
import { useAppStore, Drug } from '../store/useAppStore';
import { Calculator as CalcIcon, AlertOctagon, CheckCircle2, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Calculator() {
  const drugs = useAppStore(state => state.drugs).filter(d => !d.isDeleted);
  const [weightKg, setWeightKg] = useState<string>('');
  const [selectedDrugId, setSelectedDrugId] = useState<string>('');
  const [doseType, setDoseType] = useState<'single' | 'daily'>('single');
  const [frequency, setFrequency] = useState<string>('3');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDrugs = useMemo(() => {
    return drugs.filter(d => 
       d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
       (d.category && d.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [drugs, searchQuery]);

  const selectedDrug = drugs.find(d => d.id === selectedDrugId);

  const user = useAppStore(state => state.user);

  const result = useMemo(() => {
    if (!weightKg || !selectedDrug || isNaN(parseFloat(weightKg))) return null;
    
    const weight = parseFloat(weightKg);
    let totalDoseMgMin = weight * selectedDrug.doseMgPerKg;
    let totalDoseMgMax = selectedDrug.doseMgPerKgMax ? weight * selectedDrug.doseMgPerKgMax : totalDoseMgMin;
    
    let isMaxedOut = false;

    if (selectedDrug.maxDoseMg) {
       if (totalDoseMgMin > selectedDrug.maxDoseMg) {
           totalDoseMgMin = selectedDrug.maxDoseMg;
           isMaxedOut = true;
       }
       if (totalDoseMgMax > selectedDrug.maxDoseMg) {
           totalDoseMgMax = selectedDrug.maxDoseMg;
           isMaxedOut = true;
       }
    }

    const activeFreq = doseType === 'daily' ? (parseFloat(frequency) || 1) : 1;
    
    const calculatedDoseMgMin = totalDoseMgMin / activeFreq;
    const calculatedDoseMgMax = totalDoseMgMax / activeFreq;

    // Hitung volume: (Dosis yang dibutuhkan / Konsentrasi) * Volume Sediaan
    const rawVolumeMlMin = (calculatedDoseMgMin / selectedDrug.concentrationMg) * selectedDrug.volumeMl;
    const rawVolumeMlMax = (calculatedDoseMgMax / selectedDrug.concentrationMg) * selectedDrug.volumeMl;
    
    // Rounding logic: pembulatan ke 0.1 ml terdekat untuk spuit
    const roundedVolumeMlMin = Math.round(rawVolumeMlMin * 10) / 10;
    const roundedVolumeMlMax = Math.round(rawVolumeMlMax * 10) / 10;

    const hasRange = selectedDrug.doseMgPerKgMax !== undefined && roundedVolumeMlMin !== roundedVolumeMlMax;

    return {
      mg: hasRange ? `${calculatedDoseMgMin.toFixed(1)} - ${calculatedDoseMgMax.toFixed(1)}` : calculatedDoseMgMin.toFixed(1),
      ml: hasRange ? `${roundedVolumeMlMin.toFixed(1)} - ${roundedVolumeMlMax.toFixed(1)}` : roundedVolumeMlMin.toFixed(1),
      isMaxedOut
    };
  }, [weightKg, selectedDrug, doseType, frequency]);

  return (
    <div className="max-w-xl mx-auto space-y-6">
       <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6 relative z-10">
             <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
               <CalcIcon className="w-6 h-6" />
             </div>
             <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Kalkulator Dosis</h2>
          </div>

          <div className="space-y-5 relative z-10">
             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-1.5">Berat Badan Pasien (kg)</label>
               <input 
                 type="number" 
                 step="0.1" 
                 value={weightKg} 
                 onChange={e => setWeightKg(e.target.value)} 
                 className="w-full text-2xl font-bold border-2 border-slate-200 rounded-2xl p-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-slate-50" 
                 placeholder="0.0" 
               />
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className={doseType === 'daily' ? "col-span-1" : "col-span-2"}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Jenis Dosis (Referensi Obat)
                  </label>
                  <select
                    value={doseType}
                    onChange={(e) => setDoseType(e.target.value as 'single' | 'daily')}
                    className="w-full text-lg border-2 border-slate-200 rounded-2xl p-4 text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-slate-50 font-medium"
                  >
                    <option value="single">Per Dosis (1x Minum)</option>
                    <option value="daily">Per Hari (Total Harian)</option>
                  </select>
               </div>
               {doseType === 'daily' && (
                 <div className="col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Dibagi berapa kali?
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full text-lg border-2 border-slate-200 rounded-2xl p-4 text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-slate-50 font-medium"
                      placeholder="Misal: 3"
                    />
                 </div>
               )}
             </div>

             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pilih Obat</label>
               <div className="border-2 border-slate-200 rounded-2xl bg-white overflow-hidden flex flex-col h-72 shadow-sm">
                 <div className="relative border-b border-slate-100 shrink-0">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <Search className="w-5 h-5 text-slate-400" />
                   </div>
                   <input 
                     type="text"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Cari nama obat atau kategori..."
                     className="w-full pl-11 pr-10 py-4 focus:outline-none focus:bg-slate-50 transition-colors font-medium text-slate-700"
                   />
                   {searchQuery && (
                     <button 
                       onClick={() => setSearchQuery('')}
                       className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                     >
                       <X className="w-5 h-5" />
                     </button>
                   )}
                 </div>
                 
                 <div className="overflow-y-auto flex-1 bg-slate-50 p-2 space-y-1">
                   {filteredDrugs.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 font-medium text-sm">Obat tidak ditemukan di Drug Bank</div>
                   ) : (
                     filteredDrugs.map(d => (
                       <button
                         key={d.id}
                         onClick={() => setSelectedDrugId(d.id)}
                         className={cn(
                           "w-full text-left p-3.5 rounded-xl transition-all flex flex-col",
                           selectedDrugId === d.id 
                             ? "bg-blue-100/50 border-blue-200 border text-blue-800 shadow-sm" 
                             : "hover:bg-white border border-transparent text-slate-700"
                         )}
                       >
                         <span className="font-bold text-base">{d.name}</span>
                         <span className="text-xs text-slate-500 font-medium mt-0.5">
                           {d.category ? `${d.category} · ` : ''}{d.doseMgPerKg}{d.doseMgPerKgMax ? `-${d.doseMgPerKgMax}` : ''} mg/kg
                         </span>
                       </button>
                     ))
                   )}
                 </div>
               </div>
             </div>
          </div>
       </div>

       {result && (
         <div className={cn(
             "p-6 rounded-3xl shadow-sm border-2 transition-all transform animate-in fade-in slide-in-from-bottom-4 duration-300",
             result.isMaxedOut ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
         )}>
            <div className="flex justify-between items-start mb-2">
               <span className="text-sm uppercase tracking-wider font-bold text-slate-500">
                  Hasil - {selectedDrug?.name}
               </span>
               {result.isMaxedOut ? (
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold bg-amber-100 px-3 py-1 rounded-full text-xs">
                     <AlertOctagon className="w-4 h-4" />
                     Batas Maksimal
                  </div>
               ) : (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-full text-xs">
                     <CheckCircle2 className="w-4 h-4" />
                     Aman
                  </div>
               )}
            </div>

            <div className="text-center py-6">
               <p className="text-slate-600 mb-1 font-medium">Berikan {selectedDrug?.name} sebanyak{doseType === 'daily' ? ` (per dosis)` : ''}</p>
               <div className={cn(
                  "text-6xl font-black tracking-tighter",
                  result.isMaxedOut ? "text-amber-600" : "text-emerald-600"
               )}>
                  {result.ml} <span className="text-2xl font-bold opacity-70">ml</span>
               </div>
               <p className={cn("text-lg mt-2 font-medium", result.isMaxedOut ? "text-amber-800" : "text-emerald-800")}>
                  Setara dengan {result.mg} mg
               </p>
               
               {doseType === 'daily' && (
                  <p className="text-slate-500 font-medium mt-4">
                     Diberikan <span className="font-bold text-slate-700">{frequency} kali</span> dalam sehari.
                  </p>
               )}
            </div>

            {result.isMaxedOut && selectedDrug?.maxDoseMg && (
               <div className="mt-4 bg-amber-100/50 p-3 rounded-xl text-center text-sm font-medium text-amber-800 border border-amber-200">
                 Penyesuaian: Dosis dihentikan pada {selectedDrug.maxDoseMg} mg (Ambang Batas Dewasa).
               </div>
            )}
         </div>
       )}
    </div>
  )
}
