import React, { useState, useMemo } from 'react';
import { WorkRecord, User } from '../types';
import { RecordForm } from './RecordForm';
import { exportToCSV } from '../services/trackerService';
import { Download, Search, Filter, Trash2, Edit2, Users, Clock, AlertCircle } from 'lucide-react';

interface AdminDashboardProps {
  records: WorkRecord[];
  onUpdate: (record: WorkRecord) => void;
  onDelete: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ records, onUpdate, onDelete }) => {
  const [filterMonth, setFilterMonth] = useState(''); // Empty = All time
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([]);
  const [editingRecord, setEditingRecord] = useState<WorkRecord | null>(null);

  // Extract unique developers
  const allDevelopers = useMemo(() => {
    const devs = new Set(records.map(r => r.developerName));
    return Array.from(devs).sort();
  }, [records]);

  // Filter Logic
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchMonth = filterMonth ? record.month === filterMonth : true;
      const matchDev = selectedDevelopers.length > 0 ? selectedDevelopers.includes(record.developerName) : true;
      return matchMonth && matchDev;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, filterMonth, selectedDevelopers]);

  // Stats
  const totalHours = filteredRecords.reduce((sum, r) => sum + r.totalHours, 0);
  const activeDevsCount = new Set(filteredRecords.map(r => r.developerName)).size;
  const uniqueDays = new Set(filteredRecords.map(r => r.date)).size;
  const avgHoursPerDay = uniqueDays > 0 ? (totalHours / uniqueDays) : 0;

  const toggleDeveloperFilter = (dev: string) => {
    setSelectedDevelopers(prev => 
      prev.includes(dev) ? prev.filter(d => d !== dev) : [...prev, dev]
    );
  };

  const confirmDelete = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) {
      onDelete(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500">Overview of all project work activity</p>
        </div>
        <button
          onClick={() => exportToCSV(filteredRecords)}
          className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition shadow-sm"
        >
          <Download size={18} className="mr-2" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Total Records</h3>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Search size={18}/></div>
           </div>
           <p className="text-2xl font-bold text-slate-900">{filteredRecords.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Total Hours</h3>
              <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Clock size={18}/></div>
           </div>
           <p className="text-2xl font-bold text-slate-900">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Active Developers</h3>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={18}/></div>
           </div>
           <p className="text-2xl font-bold text-slate-900">{activeDevsCount}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Avg Hours / Day</h3>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><AlertCircle size={18}/></div>
           </div>
           <p className="text-2xl font-bold text-slate-900">{avgHoursPerDay.toFixed(1)}h</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-8">
         <div className="flex items-center mb-4">
            <Filter size={18} className="text-slate-500 mr-2" />
            <h3 className="font-semibold text-slate-800">Filters</h3>
            { (filterMonth || selectedDevelopers.length > 0) && (
                <button 
                  onClick={() => { setFilterMonth(''); setSelectedDevelopers([]); }}
                  className="ml-auto text-sm text-red-500 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
            )}
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-sm font-medium text-slate-600 mb-2">Month</label>
               <input
                 type="month"
                 value={filterMonth}
                 onChange={(e) => setFilterMonth(e.target.value)}
                 className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
               />
               <p className="text-xs text-slate-400 mt-1">Leave empty to see all history</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Developers</label>
                <div className="flex flex-wrap gap-2">
                   {allDevelopers.map(dev => (
                       <button
                         key={dev}
                         onClick={() => toggleDeveloperFilter(dev)}
                         className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                             selectedDevelopers.includes(dev)
                             ? 'bg-indigo-100 border-indigo-200 text-indigo-700'
                             : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                         }`}
                       >
                         {dev}
                       </button>
                   ))}
                   {allDevelopers.length === 0 && <span className="text-sm text-slate-400">No developers found.</span>}
                </div>
            </div>
         </div>
      </div>

      {/* Listing */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Developer</th>
                    <th className="px-6 py-4 w-1/3">Projects</th>
                    <th className="px-6 py-4">Total Hrs</th>
                    <th className="px-6 py-4 w-1/4">Notes</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {filteredRecords.length === 0 ? (
                    <tr>
                       <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                          No records match your filters.
                       </td>
                    </tr>
                 ) : (
                    filteredRecords.map(record => (
                       <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium align-top">
                             {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 align-top">
                             {record.developerName}
                          </td>
                          <td className="px-6 py-4 align-top">
                             <div className="space-y-3">
                                {record.projects.map((p, idx) => (
                                   <div key={`${record.id}-p-${idx}`} className="text-sm">
                                      <div className="flex justify-between items-baseline">
                                         <span className="font-bold text-slate-800">{p.projectName}</span>
                                         <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{p.workingHours}h</span>
                                      </div>
                                      <p className="text-slate-500 text-xs mt-0.5">{p.taskDetails}</p>
                                   </div>
                                ))}
                             </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap align-top">
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {record.totalHours} hrs
                             </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 align-top">
                             {record.notes ? record.notes : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                             <div className="flex justify-end space-x-2">
                                <button 
                                  onClick={() => setEditingRecord(record)}
                                  className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"
                                  title="Edit"
                                >
                                   <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => confirmDelete(record.id)}
                                  className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                   <Trash2 size={16} />
                                </button>
                             </div>
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>
      </div>
      
      {editingRecord && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
             <div className="w-full max-w-2xl my-auto">
                <RecordForm
                   initialData={editingRecord}
                   developerName={editingRecord.developerName}
                   onSave={(updated) => {
                       onUpdate(updated);
                       setEditingRecord(null);
                   }}
                   onCancel={() => setEditingRecord(null)}
                   isEditing={true}
                />
             </div>
          </div>
      )}
    </div>
  );
};
