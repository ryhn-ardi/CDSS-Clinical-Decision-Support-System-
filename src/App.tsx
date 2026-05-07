/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import { useAppStore } from './store/useAppStore';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Lock } from 'lucide-react';

export default function App() {
  const theme = useAppStore(state => state.theme);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setShowResetModal(true);
        }
      });
      return () => {
         authListener?.subscription.unsubscribe();
      }
    }
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
     e.preventDefault();
     setResetError('');
     if (newPassword.length < 6) {
        setResetError('Kata sandi minimal 6 karakter.');
        return;
     }

     setIsResetting(true);
     try {
       if (supabase) {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          setResetSuccess(true);
          setTimeout(() => setShowResetModal(false), 3000);
       }
     } catch(err: any) {
        setResetError(err.message || 'Gagal mengubah kata sandi');
     } finally {
        setIsResetting(false);
     }
  }

  useEffect(() => {
    document.body.classList.remove('theme-light', 'dark', 'theme-pink');
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else if (theme === 'pink') {
      document.body.classList.add('theme-pink');
    } else {
      document.body.classList.add('theme-light');
    }
  }, [theme]);

  return (
    <>
      <Dashboard />
      
      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl origin-bottom animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Buat Kata Sandi Baru</h3>
              <p className="text-sm text-slate-500 mb-6">Silakan masukkan kata sandi baru untuk akun Anda.</p>
              
              {resetSuccess ? (
                 <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 font-medium text-center">
                    Berhasil! Kata sandi telah diubah. Menutup dalam beberapa detik...
                 </div>
              ) : (
                 <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Kata Sandi Baru</label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          minLength={6}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 h-11 sm:text-sm border-slate-300 rounded-xl bg-slate-50 border outline-none px-3"
                          placeholder="Minimal 6 karakter"
                        />
                      </div>
                    </div>
                    {resetError && <p className="text-sm text-red-600 font-medium">{resetError}</p>}
                    <button
                      type="submit"
                      disabled={isResetting}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isResetting ? 'Menyimpan...' : 'Simpan Kata Sandi'}
                    </button>
                 </form>
              )}
           </div>
        </div>
      )}
    </>
  );
}
