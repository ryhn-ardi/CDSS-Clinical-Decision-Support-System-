import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Drug {
  id: string;
  name: string;
  doseMgPerKg: number;
  concentrationMg: number;
  volumeMl: number;
  maxDoseMg?: number;
  isDeleted?: boolean;
  updatedAt: number;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: number;
}

interface AuthUser {
  id: string;
  username: string;
}

interface AppState {
  user: AuthUser | null;
  drugs: Drug[];
  auditLogs: AuditLog[];
  isSyncing: boolean;
  lastSyncAt: number | null;
  
  setUser: (user: AuthUser | null) => void;
  addDrug: (drug: Omit<Drug, 'id' | 'updatedAt'>) => void;
  updateDrug: (id: string, drug: Partial<Drug>) => void;
  deleteDrug: (id: string) => void;
  addAuditLog: (action: string, details: string) => void;
  
  syncWithCloud: () => Promise<void>;
  localLogout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      drugs: [],
      auditLogs: [],
      isSyncing: false,
      lastSyncAt: null,

      setUser: (user) => set({ user }),

      addDrug: (drugConfig) => {
        const id = crypto.randomUUID();
        const newDrug: Drug = {
          ...drugConfig,
          id,
          updatedAt: Date.now(),
        };
        set((state) => ({ drugs: [...state.drugs, newDrug] }));
        get().addAuditLog('Tambah Obat', `Menambahkan obat: ${newDrug.name}`);
        get().syncWithCloud(); // Try background sync
      },

      updateDrug: (id, config) => {
        set((state) => {
          const oldDrug = state.drugs.find((d) => d.id === id);
          if (!oldDrug) return state;
          
          return {
            drugs: state.drugs.map((d) => 
              d.id === id ? { ...d, ...config, updatedAt: Date.now() } : d
            ),
          };
        });
        const currentDrug = get().drugs.find(d => d.id === id);
        if (currentDrug) {
           get().addAuditLog('Ubah Obat', `Mengubah setting obat: ${currentDrug.name}`);
           get().syncWithCloud();
        }
      },

      deleteDrug: (id) => {
        const drug = get().drugs.find((d) => d.id === id);
        if (drug) {
           set((state) => ({
             drugs: state.drugs.map((d) => d.id === id ? { ...d, isDeleted: true, updatedAt: Date.now() } : d)
           }));
           get().addAuditLog('Hapus Obat', `Menghapus obat: ${drug.name}`);
           get().syncWithCloud();
        }
      },

      addAuditLog: (action, details) => {
        const newLog: AuditLog = {
          id: crypto.randomUUID(),
          action,
          details,
          timestamp: Date.now(),
        };
        set((state) => ({ auditLogs: [newLog, ...state.auditLogs].slice(0, 500) })); // Keep max 500 locally
      },

      localLogout: () => {
         // Clear local data mostly, but depends if we want the data to stay for offline.
         // Let's clear it on logout to protect data from unauthorized access.
         set({ user: null, drugs: [], auditLogs: [], lastSyncAt: null });
         if (isSupabaseConfigured && supabase) supabase.auth.signOut();
      },

      syncWithCloud: async () => {
        const state = get();
        if (!state.user || !isSupabaseConfigured || !supabase || !navigator.onLine) return;
        
        if (state.isSyncing) return;
        set({ isSyncing: true });

        try {
          // Push local audit logs that are newer than last sync
          // Push local drugs
          // In a true offline-first, this sync logic can be complex.
          // For this CDSS app, we sync local -> cloud, and cloud -> local.
          
          // 1. Fetch remote drugs
          const { data: remoteDrugs, error: fetchErr } = await supabase
            .from('drugs')
            .select('*');

          if (fetchErr) throw fetchErr;

          const localDrugs = state.drugs;
          
          // Merge logic (simplified last-write wins based on ID and timestamp)
          const mergedDrugsMap = new Map<string, Drug>();

          // remote first
          if (remoteDrugs) {
            remoteDrugs.forEach((r: any) => {
              const parsed: Drug = {
                 id: r.id,
                 name: r.name,
                 doseMgPerKg: Number(r.dose_mg_per_kg),
                 concentrationMg: Number(r.concentration_mg),
                 volumeMl: Number(r.volume_ml),
                 maxDoseMg: r.max_dose_mg ? Number(r.max_dose_mg) : undefined,
                 updatedAt: new Date(r.updated_at).getTime(),
                 isDeleted: false // if it's there, it wasn't hard deleted. If we implemented soft delete remote we'd check it.
              };
              mergedDrugsMap.set(parsed.id, parsed);
            });
          }

          // merge with local
          const toUpload: any[] = [];
          for (const local of localDrugs) {
              const remote = mergedDrugsMap.get(local.id);
              if (!remote || local.updatedAt > remote.updatedAt) {
                 if (local.isDeleted) {
                    // It was deleted locally, delete from cloud if exists
                    if (remote) await supabase.from('drugs').delete().eq('id', local.id);
                 } else {
                    // Update/Insert into cloud
                    toUpload.push({
                       id: local.id,
                       user_id: state.user.id,
                       name: local.name,
                       dose_mg_per_kg: local.doseMgPerKg,
                       concentration_mg: local.concentrationMg,
                       volume_ml: local.volumeMl,
                       max_dose_mg: local.maxDoseMg,
                       updated_at: new Date(local.updatedAt).toISOString()
                    });
                    mergedDrugsMap.set(local.id, local);
                 }
              }
          }

          if (toUpload.length > 0) {
              // Upsert
              await supabase.from('drugs').upsert(toUpload);
          }

          // Generate final drugs array
          const finalDrugs = Array.from(mergedDrugsMap.values()).filter(d => !d.isDeleted);
          
          
          // Now just insert un-uploaded Audit Logs
          // We can just dump new audit logs. For simplicity, we just keep local mostly.
          // Let's assume Audit logs are just uploaded if they happen while online.
          
          set({ drugs: finalDrugs, lastSyncAt: Date.now(), isSyncing: false });

        } catch (err) {
          console.error("Sync error:", err);
          set({ isSyncing: false });
        }
      }
    }),
    {
      name: 'cdss-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
