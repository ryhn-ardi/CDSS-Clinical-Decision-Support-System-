import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Lock, ArrowRight, Activity, AlertCircle } from 'lucide-react';

export default function AuthScreen() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setUser = useAppStore((state) => state.setUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || pin.length !== 6) {
      setError('Masukkan Username dengan benar dan PIN 6 digit.');
      return;
    }

    setLoading(true);

    try {
      const email = `${username.toLowerCase().trim()}@cdss.local`;
      const password = `${pin}SUPA`; // Append text to ensure complex enough pass and hidden

      if (isSupabaseConfigured && supabase) {
        // Try to login
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // If User Not Found (Invalid credentials message), try to auto-register
          if (signInError.message.toLowerCase().includes('invalid login credentials')) {
            const { data: regData, error: regError } = await supabase.auth.signUp({
              email,
              password,
            });
            
            if (regError) throw regError;
            
            if (regData.user) {
              setUser({ id: regData.user.id, username });
            }
          } else {
             throw signInError;
          }
        } else if (data.user) {
           setUser({ id: data.user.id, username });
        }
      } else {
        // Mock Login for completely offline without Supabase configured yet
        setUser({ id: `mock-${username}`, username });
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
            <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
              CDSS Access
            </h2>
            <p className="text-center text-sm text-slate-500 mt-2">
              Clinical Decision Support System
            </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/40 rounded-3xl sm:px-10 border border-slate-100">
          {!isSupabaseConfigured && (
            <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md flex gap-3 text-amber-800 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>Supabase belum dikonfigurasi. Aplikasi berjalan dalam mode Mock/Offline penuh. Data tidak akan tersinkronisasi.</p>
            </div>
          )}
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                User ID / NIP / Username
              </label>
              <div className="mt-2 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 h-12 sm:text-sm border-slate-300 rounded-xl bg-slate-50 border"
                  placeholder="dr_faiz"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-slate-700">
                6-Digit PIN
              </label>
              <div className="mt-2 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 h-12 sm:text-sm border-slate-300 rounded-xl bg-slate-50 border tracking-widest text-lg font-mono"
                  placeholder="••••••"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                 Sistem Auto-Registration aktif. Masukkan ID dan PIN secara konsisten.
              </p>
            </div>

            {error && (
               <div className="text-red-600 text-sm font-medium">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Mengautentikasi...' : 'Masuk Aplikasi'}
                {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
