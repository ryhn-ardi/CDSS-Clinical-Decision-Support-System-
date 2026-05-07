import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Printer, Plus, Trash2, Search, X, Pill } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Prescription() {
  const user = useAppStore(state => state.user);
  const drugs = useAppStore(state => state.drugs);

  const [patientName, setPatientName] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [age, setAge] = useState('');
  
  const [items, setItems] = useState<{ id: string; name: string; sig: string; amount: string }[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sig, setSig] = useState('');
  const [amount, setAmount] = useState('');

  // Limit suggestions and don't show if searchQuery is exactly matching a drug name
  const showSuggestions = searchQuery.trim().length > 0 && !drugs.some(d => d.name.toLowerCase() === searchQuery.toLowerCase());
  const filteredDrugs = drugs.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setItems([...items, { 
      id: crypto.randomUUID(), 
      name: searchQuery, 
      sig: sig, 
      amount: amount || '1'
    }]);
    
    setSearchQuery('');
    setSig('');
    setAmount('');
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 print:space-y-0">
      
      {/* Editor Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Printer className="w-6 h-6 text-blue-200" />
              Buat Resep Obat
            </h2>
            <p className="text-blue-100 mt-1 opacity-90">Cetak resep dalam format PDF dengan mudah.</p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Patient Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
             <div className="md:col-span-1 space-y-1">
                <label className="text-sm font-bold text-slate-700">Nama Pasien</label>
                <input 
                  type="text" 
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  placeholder="Contoh: Budi (Anak)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
             </div>
             <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Berat Badan (kg)</label>
                <input 
                  type="number" 
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  placeholder="Contoh: 15"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
             </div>
             <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Umur (Opsional)</label>
                <input 
                  type="text" 
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="Contoh: 3 Tahun"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
             </div>
          </div>

          <hr className="border-slate-100" />

          {/* Add Drug Form */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
             <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-500" /> Tambah Obat
             </h3>
             <form onSubmit={handleAddItem} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-5 space-y-1 relative">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Obat</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <Search className="w-4 h-4 text-slate-400" />
                        </div>
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Ketik nama obat..."
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        />
                        {searchQuery && (
                           <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2 top-0 bottom-0 flex items-center justify-center text-slate-400 hover:text-slate-600">
                              <X className="w-4 h-4" />
                           </button>
                        )}
                     </div>

                     {/* Autocomplete Suggestions */}
                     {showSuggestions && filteredDrugs.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-20">
                           {filteredDrugs.map(d => (
                              <button
                                 key={d.id}
                                 type="button"
                                 onClick={() => setSearchQuery(d.name)}
                                 className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex items-center gap-2"
                              >
                                 <Pill className="w-4 h-4 text-slate-300" />
                                 <span className="font-medium text-slate-700">{d.name}</span>
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
                  
                  <div className="md:col-span-4 space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Signa (Aturan Pakai)</label>
                     <input 
                       type="text" 
                       value={sig}
                       onChange={e => setSig(e.target.value)}
                       placeholder="Contoh: 3 dd 1 cth"
                       className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                     />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah (No.)</label>
                     <input 
                       type="text" 
                       value={amount}
                       onChange={e => setAmount(e.target.value)}
                       placeholder="Contoh: I fls"
                       className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center"
                     />
                  </div>

                  <div className="md:col-span-1 pt-5">
                     <button 
                       type="submit" 
                       disabled={!searchQuery.trim()}
                       className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
                     >
                        <Plus className="w-5 h-5" />
                     </button>
                  </div>
               </div>
             </form>
          </div>

          {/* List of Prescribed Drugs */}
          <div className="space-y-3">
             <h3 className="font-bold text-slate-700 flex items-center justify-between">
               Daftar Obat Resep
               <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{items.length} Obat</span>
             </h3>
             
             {items.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium">
                   Belum ada obat yang ditambahkan ke resep.
                </div>
             ) : (
                <div className="space-y-2">
                   {items.map((item, index) => (
                      <div key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm gap-4">
                         <div className="flex items-start gap-4">
                            <div className="bg-slate-50 text-slate-400 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-100">
                               {index + 1}
                            </div>
                            <div>
                               <div className="flex items-baseline gap-2">
                                  <h4 className="font-bold text-lg text-slate-800">{item.name}</h4>
                                  <span className="text-sm font-semibold text-slate-500">No. {item.amount}</span>
                               </div>
                               <p className="text-slate-600 font-medium font-serif italic text-sm mt-0.5">S. {item.sig}</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => removeItem(item.id)}
                           className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition-colors self-end sm:self-auto"
                         >
                            <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                   ))}
                </div>
             )}
          </div>

          {/* Action Print */}
          {items.length > 0 && (
             <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                   onClick={() => window.print()} 
                   className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-sm transition-all focus:ring-4 focus:ring-emerald-500/20 flex items-center gap-2"
                >
                   <Printer className="w-5 h-5" /> Cetak PDF / Print 
                </button>
             </div>
          )}

        </div>
      </div>

      {/* Print-only template - Fully visible ONLY when printing, taking over screen */}
      <div className="hidden print:block fixed inset-0 bg-white text-black z-[100] h-screen w-screen p-12">
         {/* Kop Surat Header */}
         <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-6">
            <div>
               <h1 className="text-2xl font-black uppercase tracking-tight">Klinik & Praktik Mandiri</h1>
               <p className="font-medium mt-1 text-sm">Jl. Kesehatan No. 123, Kota Medika</p>
            </div>
            <div className="text-right text-sm">
               <p className="font-bold text-lg">dr. {user?.username}</p>
               <p>SIP: {user?.id.substring(0,8)}/SIP/2026</p>
            </div>
         </div>
         
         {/* Patient Meta */}
         <div className="mb-10 text-sm">
            <table className="w-full">
               <tbody>
                 <tr>
                   <td className="py-1 w-24"><strong>Nama Pasien</strong></td>
                   <td className="py-1 w-4">:</td>
                   <td className="py-1 border-b border-black/30 w-1/2">{patientName || '-'}</td>
                   <td className="py-1 px-4 w-24 text-right"><strong>Tanggal</strong></td>
                   <td className="py-1 w-4 text-center">:</td>
                   <td className="py-1 border-b border-black/30 w-1/4">{new Date().toLocaleDateString('id-ID')}</td>
                 </tr>
                 <tr>
                   <td className="py-1"><strong>Umur</strong></td>
                   <td className="py-1">:</td>
                   <td className="py-1 border-b border-black/30">{age || '-'}</td>
                   <td className="py-1 px-4 text-right"><strong>BB</strong></td>
                   <td className="py-1 text-center">:</td>
                   <td className="py-1 border-b border-black/30">{weightKg ? `${weightKg} kg` : '-'}</td>
                 </tr>
               </tbody>
            </table>
         </div>

         {/* Rx Body */}
         <div className="min-h-[500px]">
            {items.map((item, index) => (
               <div key={item.id} className="mb-6 flex gap-4">
                  <div className="text-4xl font-serif italic text-slate-800">R/</div>
                  <div className="flex-1 pt-1">
                     <div className="flex justify-between items-baseline pr-12">
                        <p className="text-xl font-bold">{item.name}</p>
                        <p className="text-lg font-bold">No. {item.amount}</p>
                     </div>
                     <p className="text-lg mt-1 font-serif">
                        S. {item.sig}
                     </p>
                     <div className="mt-4 border-b border-black/20 pb-2 mr-12 w-3/4 opacity-0">Separator line</div>
                  </div>
               </div>
            ))}
         </div>

         {/* Footer Signature */}
         <div className="mt-10 text-right pr-12">
            <p className="mb-16">Tanda Tangan Dokter,</p>
            <p className="font-bold underline underline-offset-4">dr. {user?.username}</p>
         </div>
      </div>

    </div>
  )
}
