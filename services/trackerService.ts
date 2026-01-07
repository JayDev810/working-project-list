import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WorkRecord, ProjectEntry } from '../types';

// --- CONFIGURATION ---
// REPLACE THESE WITH YOUR ACTUAL SUPABASE KEYS
const SUPABASE_URL = "https://ktgrmwajwiobqybvkhjw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Z3Jtd2Fqd2lvYnF5YnZraGp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NjY4OTUsImV4cCI6MjA4MzM0Mjg5NX0.oSmMgddeDOZoIhlU5XPfp4YN66wocv9sMW50nY6_w6o";

let supabase: SupabaseClient | null = null;

// --- Initialization ---
const initSupabase = () => {
  // Check against the default placeholder, not the actual ID
  if (!SUPABASE_URL || SUPABASE_URL.includes("your-project-id")) {
    console.warn("Supabase not configured. Please set API keys in trackerService.ts");
    return;
  }
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase client initialized for project:", SUPABASE_URL);
  } catch (e) {
    console.error("Failed to initialize Supabase", e);
  }
};

initSupabase();

export const isConfigured = (): boolean => {
  return !!supabase && !SUPABASE_URL.includes("your-project-id");
};

// --- Data Methods ---

export const fetchRecords = async (): Promise<WorkRecord[]> => {
  if (!isConfigured() || !supabase) throw new Error("Supabase not configured");

  try {
    // We store the whole object in a 'content' JSONB column to mimic NoSQL behavior easily
    const { data, error } = await supabase
      .from('work_records')
      .select('*');

    if (error) {
      // Handle specific 404/PGRST errors that might mean table doesn't exist
      if (error.code === '42P01') {
          throw new Error("Table 'work_records' not found. Please run the SQL setup script.");
      }
      throw error;
    }
    
    return (data || []).map((row: any) => row.content);
  } catch (e: any) {
    console.error("Error fetching records:", e);
    throw e;
  }
};

export const subscribeToRecords = (
  onData: (data: WorkRecord[]) => void,
  onError?: (error: string) => void
) => {
  if (!isConfigured() || !supabase) {
    if (onError) onError("MISSING_KEYS");
    return () => {};
  }

  // 1. Fetch initial data
  const loadData = async () => {
    try {
      const records = await fetchRecords();
      onData(records);
    } catch (e: any) {
      if (onError) onError(e.message || "Failed to fetch data");
    }
  };

  loadData();

  // 2. Subscribe to changes
  console.log("Subscribing to Supabase channel...");
  const channel = supabase
    .channel('public:work_records')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'work_records' },
      (payload) => {
        console.log('Change received!', payload);
        // On any change, re-fetch to keep it synced
        loadData();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Supabase Realtime connected');
      }
      if (status === 'CHANNEL_ERROR') {
        // This usually happens if Realtime is disabled or network fails
        console.warn("Realtime channel error - falling back to basic fetch");
        if (onError) onError("Realtime connection issue (Updates may be delayed)");
      }
    });

  return () => {
    supabase?.removeChannel(channel);
  };
};

export const saveRecord = async (record: WorkRecord) => {
  if (!isConfigured() || !supabase) throw new Error("Supabase not configured");

  try {
    // Upsert: matches on ID. We store the entire object in the 'content' column
    const { error } = await supabase
      .from('work_records')
      .upsert({ 
        id: record.id, 
        content: record 
      })
      .select();

    if (error) throw error;
    console.log("Record saved to Supabase.");
  } catch (e: any) {
    console.error("Error saving record:", e);
    throw new Error(e.message || "Failed to save");
  }
};

export const deleteRecord = async (id: string) => {
  if (!isConfigured() || !supabase) throw new Error("Supabase not configured");

  try {
    const { error } = await supabase
      .from('work_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
    console.log("Record deleted from Supabase.");
  } catch (e: any) {
    console.error("Error deleting record:", e);
    throw new Error(e.message || "Failed to delete");
  }
};

export const deleteRecordsByDeveloper = async (developerName: string) => {
  if (!isConfigured() || !supabase) throw new Error("Supabase not configured");

  try {
    // Delete all records where the JSON content field has a developerName matching the argument
    const { error } = await supabase
      .from('work_records')
      .delete()
      .eq('content->>developerName', developerName);

    if (error) throw error;
    console.log(`All records for ${developerName} deleted from Supabase.`);
  } catch (e: any) {
    console.error("Error deleting developer records:", e);
    throw new Error(e.message || "Failed to delete developer records");
  }
};

export const calculateTotalHours = (projects: ProjectEntry[]): number => {
  return projects.reduce((sum, p) => sum + (Number(p.workingHours) || 0), 0);
};

export const migrateLocalData = async () => {
   if (!isConfigured() || !supabase) throw new Error("Supabase not connected");
   
   const STORAGE_KEY = 'daily_project_tracker_data';
   const localData = localStorage.getItem(STORAGE_KEY);
   if (localData) {
       const records = JSON.parse(localData);
       
       // Bulk insert/upsert
       const rows = records.map((r: WorkRecord) => ({
           id: r.id,
           content: r
       }));

       const { error } = await supabase
           .from('work_records')
           .upsert(rows);

       if (error) throw error;
       return rows.length;
   }
   return 0;
};

export const exportToCSV = (records: WorkRecord[]): void => {
  const headers = ['ID', 'Date', 'Developer', 'Total Hours', 'Notes', 'Projects (Name: Details [Hours])'];
  
  const csvRows = records.map(r => {
    const projectString = r.projects.map(p => `${p.projectName}: ${p.taskDetails} [${p.workingHours}h]`).join(' | ');
    return [
      r.id,
      r.date,
      `"${r.developerName}"`,
      r.totalHours,
      `"${r.notes ? r.notes.replace(/"/g, '""') : ''}"`, 
      `"${projectString.replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `work_tracker_export_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};