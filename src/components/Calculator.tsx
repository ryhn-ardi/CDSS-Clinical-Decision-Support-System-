import React, { useState, useMemo } from 'react';
import { useAppStore, Drug } from '../store/useAppStore';
import { Calculator as CalcIcon, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Calculator() {
  const drugs = useAppStore(state => state.drugs).filter(d => !d.isDeleted);
  const [weightKg, setWeightKg] = useState<string>('');
  const [selectedDrugId, setSelectedDrugId] = useState<string>('');

  const selectedDrug = drugs.find(d => d.id === selectedDrugId);

  const result = useMemo(() => {
    if (!weightKg || !selectedDrug || isNaN(parseFloat(weightKg))) return null;
    
    const weight = parseFloat(weightKg);
    let calculatedDoseMg = weight * selectedDrug.doseMgPerKg;
    let isMaxedOut = false;

    if (selectedDrug.maxDoseMg && calculatedDoseMg > selectedDrug.maxDoseMg) {
       calculatedDoseMg = selectedDrug.maxDoseMg;
       isMaxedOut = true;
    }

    // Hitung volume: (Dosis yang dibutuhkan / Konsentrasi) * Volume Sediaan
    const rawVolumeMl = (calculatedDoseMg / selectedDrug.concentrationMg) * selectedDrug.volumeMl;
    
    // Rounding logic: pembulatan ke 0.1 ml terdekat untuk spuit
    const roundedVolumeMl = Math.round(rawVolumeMl * 10) / 10;

    return {
      mg: calculatedDoseMg.toFixed(1),
      ml: roundedVolumeMl.toFixed(1),
      isMaxedOut
    };
  }, [weightKg, selectedDrug]);

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

             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pilih Obat</label>
               <select 
                 value={selectedDrugId} 
                 onChange={e => setSelectedDrugId(e.target.value)} 
                 className="w-full text-lg border-2 border-slate-200 rounded-2xl p-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-slate-50 appearance-none font-medium text-slate-800"
               >
                 <option value="" disabled>--- Pilih dari Drug Bank ---</option>
                 {drugs.map(d => (
                   <option key={d.id} value={d.id}>{d.name} ({d.doseMgPerKg} mg/kg)</option>
                 ))}
               </select>
             </div>
          </div>
       </div>

       {result && (
         <div className={cn(
             "p-6 rounded-3xl shadow-sm border-2 transition-all transform animate-in fade-in slide-in-from-bottom-4 duration-300",
             result.isMaxedOut ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
         )}>
            <div className="flex justify-between items-start mb-2">
               <span className="text-sm uppercase tracking-wider font-bold text-slate-500">Hasil Perhitungan</span>
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
               <p className="text-slate-600 mb-1 font-medium">Berikan obat sebanyak</p>
               <div className={cn(
                  "text-6xl font-black tracking-tighter",
                  result.isMaxedOut ? "text-amber-600" : "text-emerald-600"
               )}>
                  {result.ml} <span className="text-2xl font-bold opacity-70">ml</span>
               </div>
               <p className={cn("text-lg mt-2 font-medium", result.isMaxedOut ? "text-amber-800" : "text-emerald-800")}>
                  Setara dengan {result.mg} mg
               </p>
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
