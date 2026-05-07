import React, { useState } from 'react';
import { useAppStore, Drug } from '../store/useAppStore';
import { Plus, Pill, Trash2, Edit2, AlertTriangle, Save, X, Search, Loader2, BookOpen } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { cn } from '../lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function DrugBank() {
  const drugs = useAppStore(state => state.drugs);
  const addDrug = useAppStore(state => state.addDrug);
  const updateDrug = useAppStore(state => state.updateDrug);
  const deleteDrug = useAppStore(state => state.deleteDrug);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [libSearchQuery, setLibSearchQuery] = useState('');
  const [isSearchingLib, setIsSearchingLib] = useState(false);
  const [libResult, setLibResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    doseMgPerKg: '',
    doseMgPerKgMax: '',
    concentrationMg: '',
    volumeMl: '',
    maxDoseMg: ''
  });

  const handleOpenAdd = () => {
    setFormData({ name: '', category: '', doseMgPerKg: '', doseMgPerKgMax: '', concentrationMg: '', volumeMl: '', maxDoseMg: '' });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleOpenEdit = (drug: Drug) => {
    setFormData({
      name: drug.name,
      category: drug.category || '',
      doseMgPerKg: drug.doseMgPerKg.toString(),
      doseMgPerKgMax: drug.doseMgPerKgMax ? drug.doseMgPerKgMax.toString() : '',
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
      category: formData.category || undefined,
      doseMgPerKg: parseFloat(formData.doseMgPerKg),
      doseMgPerKgMax: formData.doseMgPerKgMax ? parseFloat(formData.doseMgPerKgMax) : undefined,
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

  const handleSearchLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libSearchQuery.trim()) return;
    setIsSearchingLib(true);
    setLibResult(null);

    try {
      const prompt = `Cari informasi obat "${libSearchQuery}" berdasarkan referensi MIMS Indonesia.
      Keluarkan format JSON dengan struktur berikut (jangan gunakan markdown block, cukup raw JSON yang start dengan { dan end dengan } dan dapat di-parse dengan JSON.parse):
      {
        "name": "Nama obat dan sediaannya (misal: Paracetamol Drop)",
        "category": "Kategori fungsi obat (misal: Analgesik)",
        "doseMgPerKg": Dosis dasar per kgBB (angka float/int),
        "doseMgPerKgMax": Dosis batas atas per kgBB (angka float/int, opsional),
        "concentrationMg": Konsentrasi sediaan dalam mg (angka float/int),
        "volumeMl": Volume sediaan dalam ml (angka float/int),
        "maxDoseMg": Maximum dosis pasien dewasa dalam mg (angka float/int, opsional),
        "description": "Deskripsi indikasi singkat."
      }
      Jika sediaan memiliki beberapa jenis konsentrasi, berikan salah satu yang paling umum digunakan untuk pediatri/anak. Pastikan field dosis, konsentrasi, volume berupa angka bukan string.
      `;

      const response = await ai.models.generateContent({
         model: 'gemini-3.1-pro-preview',
         contents: prompt,
         config: {
            responseMimeType: "application/json"
         }
      });

      const text = response.text;
      if (text) {
          const data = JSON.parse(text);
          setLibResult(data);
      }
    } catch (error) {
      console.error("AI Search error:", error);
      alert("Gagal menemukan obat di Library (MIMS). Pastikan nama obat benar atau coba nama generik.");
    } finally {
      setIsSearchingLib(false);
    }
  };

  const useLibraryData = (data: any) => {
    setFormData({
      name: data.name || '',
      category: data.category || '',
      doseMgPerKg: data.doseMgPerKg != null ? String(data.doseMgPerKg) : '',
      doseMgPerKgMax: data.doseMgPerKgMax != null ? String(data.doseMgPerKgMax) : '',
      concentrationMg: data.concentrationMg != null ? String(data.concentrationMg) : '',
      volumeMl: data.volumeMl != null ? String(data.volumeMl) : '',
      maxDoseMg: data.maxDoseMg != null ? String(data.maxDoseMg) : ''
    });
    setIsAdding(true);
    setEditingId(null);
    setLibResult(null); 
    setLibSearchQuery('');
  };

  return (
    <div className="space-y-6">

       {/* Medical Library Search */}
       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
          {/* subtle background deco */}
          <div className="absolute -right-4 -top-10 text-blue-100/50 pointer-events-none">
             <BookOpen className="w-40 h-40" />
          </div>
          
          <div className="relative z-10">
             <div className="flex items-center gap-3 mb-4">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-blue-100 text-blue-600">
                   <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-lg">Medical Library</h2>
                  <p className="text-sm text-slate-600">Referensi MIMS Indonesia.</p>
                </div>
             </div>
             
             <form onSubmit={handleSearchLibrary} className="flex flex-col sm:flex-row gap-3">
               <div className="relative flex-1">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <Search className="w-5 h-5 text-slate-400" />
                 </div>
                 <input 
                   type="text" 
                   value={libSearchQuery}
                   onChange={e => setLibSearchQuery(e.target.value)}
                   className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 bg-white shadow-sm font-medium"
                   placeholder="Contoh: Paracetamol sirup 120mg/5ml, Amoxicillin drop..."
                 />
               </div>
               <button 
                 type="submit" 
                 disabled={isSearchingLib || !libSearchQuery.trim()}
                 className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3.5 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2"
               >
                 {isSearchingLib ? <><Loader2 className="w-5 h-5 animate-spin" /> Mencari...</> : 'Cari Obat'}
               </button>
             </form>

             {libResult && (
               <div className="mt-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                 <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                   <div className="flex-1">
                     <div className="flex items-center gap-2 mb-2">
                       <h3 className="font-bold text-lg text-slate-800">{libResult.name}</h3>
                       {libResult.category && (
                          <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md uppercase tracking-wider">
                             {libResult.category}
                          </span>
                       )}
                     </div>
                     <p className="text-sm text-slate-600 mb-4">{libResult.description}</p>
                     
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="block text-slate-400 text-xs font-semibold mb-0.5 uppercase tracking-wide">Dosis</span>
                          <span className="font-bold text-slate-700">{libResult.doseMgPerKg}{libResult.doseMgPerKgMax ? ` - ${libResult.doseMgPerKgMax}` : ''} <span className="font-medium text-xs text-slate-500">mg/kg</span></span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="block text-slate-400 text-xs font-semibold mb-0.5 uppercase tracking-wide">Sediaan</span>
                          <span className="font-bold text-slate-700">{libResult.concentrationMg} <span className="font-medium text-xs text-slate-500">mg</span> / {libResult.volumeMl} <span className="font-medium text-xs text-slate-500">ml</span></span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="block text-slate-400 text-xs font-semibold mb-0.5 uppercase tracking-wide">Max Dose Dewasa</span>
                          <span className="font-bold text-slate-700">{libResult.maxDoseMg ? `${libResult.maxDoseMg} mg` : '-'}</span>
                        </div>
                     </div>
                   </div>
                   
                   <button 
                     onClick={() => useLibraryData(libResult)}
                     className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-sm transition-all whitespace-nowrap shrink-0 flex items-center justify-center gap-2 w-full md:w-auto"
                   >
                     <Plus className="w-4 h-4" />
                     Gunakan Data Ini
                   </button>
                 </div>
               </div>
             )}
          </div>
       </div>

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
               <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2 sm:col-span-1">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Nama Obat</label>
                   <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Misal: Paracetamol Drop" />
                 </div>
                 <div className="col-span-2 sm:col-span-1">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                   <input type="text" list="categories" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Opsional (Misal: Analgesik)" />
                   <datalist id="categories">
                     <option value="Analgesik" />
                     <option value="Antibiotik" />
                     <option value="Antipiretik" />
                     <option value="Antihistamin" />
                     <option value="Kortikosteroid" />
                   </datalist>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2 sm:col-span-1">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Dosis Dasar (mg/kgBB)</label>
                   <div className="flex items-center gap-2">
                     <input required type="number" step="0.01" value={formData.doseMgPerKg} onChange={e => setFormData({...formData, doseMgPerKg: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Min" />
                     <span className="text-slate-400">-</span>
                     <input type="number" step="0.01" value={formData.doseMgPerKgMax} onChange={e => setFormData({...formData, doseMgPerKgMax: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Max (Opsional)" />
                   </div>
                 </div>
                 <div className="col-span-2 sm:col-span-1">
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
                    <div className="flex flex-col">
                     <h3 className="font-bold text-slate-800 text-lg">{drug.name}</h3>
                     {drug.category && <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-0.5 inline-block self-start">{drug.category}</span>}
                  </div>
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
                    <span className="font-medium text-slate-700">
                      {drug.doseMgPerKg}{drug.doseMgPerKgMax ? ` - ${drug.doseMgPerKgMax}` : ''} <span className="text-slate-400 text-xs">mg/kg</span>
                    </span>
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
