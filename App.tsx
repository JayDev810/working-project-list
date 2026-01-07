import React, { useState, useEffect } from 'react';
import { User, WorkRecord } from './types';
import { MemberDashboard } from './components/MemberDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { 
  subscribeToRecords, 
  saveRecord, 
  deleteRecord, 
  migrateLocalData
} from './services/trackerService';
import { LogOut, Shield, ArrowRight, User as UserIcon, Cloud, UploadCloud, AlertCircle, WifiOff, Database, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [usernameInput, setUsernameInput] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Subscribe to realtime data
  useEffect(() => {
    const unsubscribe = subscribeToRecords(
      (data) => {
        setRecords(data);
        setLastSynced(new Date());
        setConnectionError(null);
      },
      (errorMsg) => {
        console.error("App received error:", errorMsg);
        setConnectionError(errorMsg);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSaveRecord = async (record: WorkRecord) => {
    try {
        await saveRecord(record);
    } catch (e: any) {
        alert("Failed to save record: " + e.message);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
        await deleteRecord(id);
    } catch (e: any) {
        alert("Failed to delete record: " + e.message);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUsernameInput('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = usernameInput.trim();
    if (!trimmedName) return;

    if (trimmedName === 'Admin Jay') {
      setCurrentUser({
        id: 'admin',
        name: trimmedName,
        role: 'ADMIN'
      });
    } else {
      setCurrentUser({
        id: crypto.randomUUID(),
        name: trimmedName,
        role: 'MEMBER'
      });
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
        const count = await migrateLocalData();
        alert(`Successfully migrated ${count} local records to the cloud.`);
    } catch (e) {
        alert("Migration failed. Ensure database is connected.");
        console.error(e);
    } finally {
        setMigrating(false);
    }
  };

  const isMissingKeys = connectionError === "MISSING_KEYS";

  const ErrorBanner = () => (
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 m-4 rounded shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-500" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-800 font-bold">
              Supabase Not Connected
            </p>
            {isMissingKeys ? (
                <div className="text-sm text-amber-700 mt-2">
                    <p className="mb-2">You need to configure your Supabase keys in <code className="bg-amber-100 px-1 rounded">services/trackerService.ts</code>.</p>
                    <p className="font-semibold mb-1">Steps:</p>
                    <ol className="list-decimal list-inside space-y-1 mb-2">
                        <li>Create a project at <a href="https://supabase.com" target="_blank" className="underline">supabase.com</a></li>
                        <li>Run the SQL below in the SQL Editor</li>
                        <li>Copy Project URL & Anon Key to the code</li>
                    </ol>
                    <div className="bg-slate-800 text-slate-200 p-2 rounded text-xs font-mono overflow-x-auto">
                        create table work_records (<br/>
                        &nbsp;&nbsp;id text primary key,<br/>
                        &nbsp;&nbsp;content jsonb not null<br/>
                        );<br/>
                        alter table work_records enable row level security;<br/>
                        create policy "Public Access" on work_records for all using (true) with check (true);
                    </div>
                </div>
            ) : (
                <p className="text-sm text-amber-700 mt-1">{connectionError}</p>
            )}
          </div>
        </div>
      </div>
  );

  // 1. Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-emerald-600 p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-4 text-white backdrop-blur-sm">
                <Database size={24} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-emerald-100">Enter your name to access your tracker</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  id="username"
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!usernameInput.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-200"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight size={18} className="ml-2" />
              </button>
            </form>
          </div>
        </div>
        
        {connectionError && <div className="max-w-md w-full"><ErrorBanner /></div>}

        <div className="mt-6 flex justify-center space-x-4">
             <button onClick={handleMigrate} disabled={migrating || !!connectionError} className="text-xs text-slate-400 hover:text-emerald-500 flex items-center disabled:opacity-50">
                <UploadCloud size={12} className="mr-1" /> {migrating ? "Migrating..." : "Upload Local Data"}
             </button>
        </div>
      </div>
    );
  }

  // 2. Dashboard
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
                <Shield size={20} className="text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg hidden sm:inline">Daily Work Tracker</span>
            {connectionError ? (
                <div className="flex items-center px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium cursor-help" title={connectionError}>
                     <WifiOff size={10} className="mr-1" /> Error
                </div>
            ) : (
                <div className="flex items-center space-x-2">
                    <div className="flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        <Cloud size={10} className="mr-1" /> Online
                    </div>
                    {lastSynced && (
                        <div className="hidden md:flex items-center text-xs text-slate-400">
                            <RefreshCw size={10} className="mr-1" />
                            Synced {lastSynced.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                <div className={`w-2 h-2 rounded-full ${currentUser.role === 'ADMIN' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                <span className="text-sm font-medium text-slate-600">
                    {currentUser.name} <span className="text-slate-400 text-xs ml-1">({currentUser.role === 'ADMIN' ? 'Admin' : 'Member'})</span>
                </span>
             </div>
             <button
               onClick={handleLogout}
               className="text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-full hover:bg-slate-100"
               title="Logout"
             >
                <LogOut size={20} />
             </button>
          </div>
        </div>
      </header>
      
      {connectionError && (
        <div className="max-w-7xl mx-auto px-4">
            <ErrorBanner />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow">
        {currentUser.role === 'ADMIN' ? (
          <AdminDashboard
            records={records}
            onUpdate={handleSaveRecord}
            onDelete={handleDeleteRecord}
          />
        ) : (
          <MemberDashboard
            currentUser={currentUser}
            records={records}
            onSave={handleSaveRecord}
            onDelete={handleDeleteRecord}
          />
        )}
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
         <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} Daily Project Work Tracker. 
            {connectionError ? ' Sync Paused' : ' Cloud Sync Active (Supabase)'}
         </div>
      </footer>
    </div>
  );
};

export default App;