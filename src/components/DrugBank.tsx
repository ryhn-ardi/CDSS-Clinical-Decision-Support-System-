import React, { useState } from 'react';
import { useAppStore, Drug } from '../store/useAppStore';
import { Plus, Pill, Trash2, Edit2, AlertTriangle, Save, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function DrugBank() {
  const drugs = useAppStore(state => state.drugs);
  const addDrug = useAppStore(state => state.addDrug);
  const updateDrug = useAppStore(state => state.updateDrug);
  const deleteDrug = useAppStore(state => state.deleteDrug);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    doseMgPerKg: '',
    concentrationMg: '',
    volumeMl: '',
    maxDoseMg: ''
  });

  const handleOpenAdd = () => {
    setFormData({ name: '', doseMgPerKg: '', concentrationMg: '', volumeMl: '', maxDoseMg: '' });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleOpenEdit = (drug: Drug) => {
    setFormData({
      name: drug.name,
      doseMgPerKg: drug.doseMgPerKg.toString(),
      concentrationMg: drug.concentrationMg.toString(),
      volumeMl: drug.volumeMl.toString(),
      maxDoseMg: drug.maxDoseMg ? drug.maxDoseMg.toString() : ''
    });
    setEditingId(drug.id);
    setIsAdding(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.doseMgPerKg || !formData.concentrationMg || !formData.volumeMl) return;

    const config = {
      name: formData.name,
      doseMgPerKg: parseFloat(formData.doseMgPerKg),
      concentrationMg: parseFloat(formData.concentrationMg),
      volumeMl: parseFloat(formData.volumeMl),
      maxDoseMg: formData.maxDoseMg ? parseFloat(formData.maxDoseMg) : undefined,
    };

    if (editingId) {
      updateDrug(editingId, config);
    } else {
      addDrug(config);
    }

    setIsAdding(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hapus obat ${name}?`)) {
      deleteDrug(id);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
           <div>
              <h2 className="text-xl font-bold text-slate-800">Drug Bank</h2>
              <p className="text-sm text-slate-500">Database Obat Custom Anda</p>
           </div>
           {!isAdding && (
             <button
               onClick={handleOpenAdd}
               className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
             >
               <Plus className="w-4 h-4" />
               Tambah Obat
             </button>
           )}
       </div>

       {isAdding && (
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Edit Obat' : 'Tambah Obat Baru'}</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Nama Obat</label>
                 <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Misal: Paracetamol Drop" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Dosis Standar (mg/kgBB)</label>
                   <input required type="number" step="0.01" value={formData.doseMgPerKg} onChange={e => setFormData({...formData, doseMgPerKg: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Misal: 10" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Max Dose Dewasa (mg)</label>
                   <input type="number" step="0.1" value={formData.maxDoseMg} onChange={e => setFormData({...formData, maxDoseMg: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Opsional (Misal: 500)" />
                 </div>
               </div>

               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-blue-900 mb-1">Konsentrasi (mg)</label>
                    <input required type="number" step="0.1" value={formData.concentrationMg} onChange={e => setFormData({...formData, concentrationMg: e.target.value})} className="w-full border border-blue-200 rounded-lg p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Misal: 250" />
                  </div>
                  <div className="flex items-center justify-center pt-6 text-blue-400 font-bold">/</div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-blue-900 mb-1">Volume (ml)</label>
                    <input required type="number" step="0.1" value={formData.volumeMl} onChange={e => setFormData({...formData, volumeMl: e.target.value})} className="w-full border border-blue-200 rounded-lg p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Misal: 5" />
                  </div>
               </div>
               
               <div className="flex justify-end pt-2">
                 <button type="submit" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-slate-800 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Simpan Obat
                 </button>
               </div>
            </form>
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {drugs.filter(d => !d.isDeleted).map(drug => (
           <div key={drug.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                 <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                       <Pill className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">{drug.name}</h3>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => handleOpenEdit(drug)} className="text-slate-400 hover:text-blue-600 p-1">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(drug.id, drug.name)} className="text-slate-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 flex-1">
                 <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Dosis Dasar</span>
                    <span className="font-medium text-slate-700">{drug.doseMgPerKg} <span className="text-slate-400 text-xs">mg/kg</span></span>
                 </div>
                 <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Sediaan</span>
                    <span className="font-medium text-slate-700">{drug.concentrationMg}mg / {drug.volumeMl}ml</span>
                 </div>
              </div>
              
              {drug.maxDoseMg && (
                 <div className="mt-2 text-xs flex items-center gap-1.5 text-amber-600 bg-amber-50 p-1.5 rounded-md">
                   <AlertTriangle className="w-3.5 h-3.5" />
                   Safety limit: {drug.maxDoseMg} mg
                 </div>
              )}
           </div>
         ))}
         {drugs.filter(d => !d.isDeleted).length === 0 && !isAdding && (
           <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
              <Pill className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p>Belum ada obat di database Anda.</p>
              <button onClick={handleOpenAdd} className="mt-3 text-blue-600 font-medium text-sm hover:underline">Tambah Obat Pertama</button>
           </div>
         )}
       </div>
    </div>
  )
}
