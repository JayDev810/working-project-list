import React, { useState, useEffect } from 'react';
import { User, WorkRecord } from './types';
import { MemberDashboard } from './components/MemberDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { getRecords, saveRecord, deleteRecord } from './services/trackerService';
import { LogOut, Shield, ArrowRight, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [usernameInput, setUsernameInput] = useState('');

  // Load records on mount
  useEffect(() => {
    const data = getRecords();
    setRecords(data);
  }, []);

  const handleSaveRecord = (record: WorkRecord) => {
    saveRecord(record);
    setRecords(getRecords()); // Refresh from storage
  };

  const handleDeleteRecord = (id: string) => {
    deleteRecord(id);
    setRecords(getRecords()); // Refresh from storage
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUsernameInput('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = usernameInput.trim();
    if (!trimmedName) return;

    // Secret Admin Access Check
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-4 text-white backdrop-blur-sm">
                <UserIcon size={24} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-indigo-100">Enter your name to access your tracker</p>
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
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!usernameInput.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight size={18} className="ml-2" />
              </button>
            </form>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
             Secure local storage • No password required
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Shield size={20} className="text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg hidden sm:inline">Daily Work Tracker</span>
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
            &copy; {new Date().getFullYear()} Daily Project Work Tracker. All data stored locally.
         </div>
      </footer>
    </div>
  );
};

export default App;