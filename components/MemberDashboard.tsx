import React, { useState, useMemo } from 'react';
import { WorkRecord, User } from '../types';
import { RecordForm } from './RecordForm';
import { exportToCSV } from '../services/trackerService';
import { Calendar, Clock, FileText, Plus, Download, Edit2, Trash2 } from 'lucide-react';

interface MemberDashboardProps {
  currentUser: User;
  records: WorkRecord[];
  onSave: (record: WorkRecord) => void;
  onDelete: (id: string) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ currentUser, records, onSave, onDelete }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WorkRecord | null>(null);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  // Filter records for current user
  const myRecords = useMemo(() => {
    return records
      .filter(r => r.developerName === currentUser.name)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, currentUser.name]);

  // Apply month filter
  const filteredRecords = useMemo(() => {
    return myRecords.filter(r => r.month === filterMonth);
  }, [myRecords, filterMonth]);

  const existingDates = myRecords.map(r => r.date);

  // Calculate monthly stats
  const monthlyHours = filteredRecords.reduce((sum, r) => sum + r.totalHours, 0);

  const confirmDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      onDelete(id);
    }
  };

  const handleSaveInternal = (record: WorkRecord) => {
      // 1. Save the record (optimistic update happens in parent)
      onSave(record);
      
      // 2. Ensure the filter is set to this record's month so the user sees it immediately
      // This fixes the issue where adding a record for a different month makes it "disappear"
      if (record.month !== filterMonth) {
          setFilterMonth(record.month);
      }
      
      // 3. Close modals
      setIsCreating(false);
      setEditingRecord(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Work Tracker</h1>
          <p className="text-slate-500">Welcome back, {currentUser.name}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => exportToCSV(filteredRecords)}
              disabled={filteredRecords.length === 0}
              className={`px-4 py-2.5 rounded-lg shadow-sm border transition flex items-center justify-center ${
                  filteredRecords.length === 0 
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Export displayed records to CSV"
            >
              <Download size={18} className="mr-2" />
              Export Month
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-indigo-700 transition flex items-center justify-center"
            >
              <Plus size={20} className="mr-2" />
              Log Daily Work
            </button>
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-auto">
             <RecordForm
                developerName={currentUser.name}
                onSave={handleSaveInternal}
                onCancel={() => setIsCreating(false)}
                existingDates={existingDates}
             />
          </div>
        </div>
      )}

      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-auto">
             <RecordForm
                initialData={editingRecord}
                developerName={currentUser.name}
                onSave={handleSaveInternal}
                onCancel={() => setEditingRecord(null)}
                isEditing={true}
             />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mr-4">
                <Calendar size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">Selected Month</p>
                <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="font-semibold text-slate-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                />
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg mr-4">
                <Clock size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">Monthly Hours</p>
                <p className="text-2xl font-bold text-slate-900">{monthlyHours.toFixed(2)}h</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg mr-4">
                <FileText size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">Records Logged</p>
                <p className="text-2xl font-bold text-slate-900">{filteredRecords.length} days</p>
            </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-800">History</h2>
        {filteredRecords.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">No records found for this month.</p>
            </div>
        ) : (
            filteredRecords.map((record) => (
                <div key={record.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition hover:shadow-md">
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <span className="font-semibold text-slate-700">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span className="text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-500">{record.totalProjects} projects</span>
                        </div>
                        <div className="flex items-center space-x-4">
                             <span className="font-bold text-indigo-600">{record.totalHours} hrs</span>
                             <div className="flex items-center space-x-1 pl-4 border-l border-slate-200">
                                <button
                                    onClick={() => setEditingRecord(record)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title="Edit Record"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => confirmDelete(record.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete Record"
                                >
                                    <Trash2 size={16} />
                                </button>
                             </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {record.projects.map((p) => (
                                <div key={p.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-start pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-800 text-sm">{p.projectName}</h4>
                                        <p className="text-slate-600 text-sm mt-0.5">{p.taskDetails}</p>
                                    </div>
                                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-2 sm:mt-0 sm:ml-4 whitespace-nowrap">
                                        {p.workingHours}h
                                    </span>
                                </div>
                            ))}
                        </div>
                        {record.notes && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <p className="text-sm text-slate-500 italic">
                                    <span className="font-medium not-italic text-slate-700 mr-2">Notes:</span>
                                    {record.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};