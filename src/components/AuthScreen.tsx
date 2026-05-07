import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Lock, ArrowRight, Activity, AlertCircle, Mail } from 'lucide-react';

export default function AuthScreen() {
  const [view, setView] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const setUser = useAppStore((state) => state.setUser);

  const resolveEmailFromUsername = async (uname: string): Promise<string | null> => {
     if (!isSupabaseConfigured || !supabase) return null;
     // Fetch email from profiles table where username matches
     const { data, error } = await supabase
       .from('profiles')
       .select('email')
       .eq('username', uname)
       .single();
       
     if (error || !data) return null;
     return data.email;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password) {
      setError('Masukkan Username dan Password.');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        
        // 1. Resolve Username to Email
        const resolvedEmail = await resolveEmailFromUsername(username);
        if (!resolvedEmail) {
           setError('Username tidak ditemukan di database.');
           setLoading(false);
           return;
        }

        // 2. Login with resolved Email and Password
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password
        });

        if (signInError) throw signInError;
        if (data.user) {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !email.trim() || !password) {
      setError('Masukkan Lengkap Username, Email, dan Password.');
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
         // Query username first to avoid duplicate if desired, but we let unique constraint handle it
         const { data, error: regError } = await supabase.auth.signUp({
            email,
            password,
            options: {
               data: {
                 username: username.trim()
               }
            }
         });
         
         if (regError) throw regError;
         if (data.user) {
            setSuccess('Pendaftaran berhasil! Silakan periksa email anda untuk konfirmasi jika diperlukan, atau langsung masuk jika konfirmasi dimatikan.');
            if (data.session) {
               // Auto login if session is provided (Email verification turned off)
               setUser({ id: data.user.id, username });
            } else {
               setView('login');
            }
         }
      } else {
         setError('Supabase belum dikonfigurasi. Mode mock hanya mendukung Login.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar.');
    } finally {
      setLoading(false);
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Masukkan Email Anda.');
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
         const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
         });
         if (error) throw error;
         setSuccess('Tautan reset kata sandi telah dikirim ke email Anda.');
      } else {
         setError('Supabase belum dikonfigurasi.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim tautan reset sandi.');
    } finally {
      setLoading(false);
    }
  }

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
        <div className="bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/40 rounded-3xl border border-slate-100">
          {!isSupabaseConfigured && (
            <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md flex gap-3 text-amber-800 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>Supabase belum dikonfigurasi. Aplikasi berjalan dalam mode Mock/Offline penuh. Data tidak akan tersinkronisasi.</p>
            </div>
          )}
          
          <div className="flex space-x-2 mb-6 border-b border-slate-200 pb-2">
            <button 
               onClick={() => { setView('login'); setError(''); setSuccess(''); }}
               className={`pb-2 px-1 text-sm font-medium transition-colors ${view === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
               Masuk
            </button>
            <button 
               onClick={() => { setView('register'); setError(''); setSuccess(''); }}
               className={`pb-2 px-1 text-sm font-medium transition-colors ${view === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
               Daftar Baru
            </button>
          </div>

          {error && (
             <div className="mb-4 text-red-600 text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>
          )}
          {success && (
             <div className="mb-4 text-green-600 text-sm font-medium bg-green-50 p-3 rounded-xl border border-green-100">{success}</div>
          )}

          {view === 'login' && (
            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-slate-700">Username</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 h-11 sm:text-sm border-slate-300 rounded-xl bg-slate-50 border outline-none px-3"
                    placeholder="Username Anda"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Kata Sandi</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 h-11 sm:text-sm border-slate-300 rounded-xl bg-slate-50 border outline-none px-3"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setView('forgot_password')} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Lupa Kata Sandi?</button>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors disabled:opacity-50"
              >
                {loading ? 'Memproses...' : 'Masuk Aplikasi'}
              </button>
            </form>
          )}

          {view === 'register' && (
            <form className="space-y-5" onSubmit={handleRegister}>
              <div>
                <label className="block text-sm font-medium text-slate-700">Username (Akan digunakan untuk login)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-400" /></div>
                  <input
                    type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 h-11 sm:text-sm border-slate-300 rounded-xl bg-slate-50 border outline-none px-3"
                    placeholder="username_anda"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email Utama (Untuk Reset Sandi)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 h-11 sm:text-sm border-slate-300 rounded-xl bg-slate-50 border outline-none px-3"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Kata Sandi Baru</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div>
                  <input
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 h-11 sm:text-sm border-slate-300 rounded-xl bg-slate-50 border outline-none px-3"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors disabled:opacity-50"
              >
                {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
              </button>
            </form>
          )}

          {view === 'forgot_password' && (
            <form className="space-y-5" onSubmit={handleForgotPassword}>
              <p className="text-sm text-slate-600 mb-2">Punya masalah dengan kata sandi? Masukkan email yang Anda gunakan saat mendaftar, dan kami akan mengirimkan tautan reset.</p>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email Pemulihan</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 h-11 sm:text-sm border-slate-300 rounded-xl bg-slate-50 border outline-none px-3"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors disabled:opacity-50"
              >
                {loading ? 'Mengirim...' : 'Kirim Tautan Reset'}
              </button>
              <div className="text-center mt-4">
                 <button type="button" onClick={() => setView('login')} className="text-sm text-slate-500 hover:text-slate-800 font-medium">Kembali ke Login</button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
