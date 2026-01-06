import React, { useState, useEffect } from 'react';
import { ProjectEntry, WorkRecord } from '../types';
import { calculateTotalHours } from '../services/trackerService';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface RecordFormProps {
  initialData?: WorkRecord | null;
  developerName: string;
  onSave: (record: WorkRecord) => void;
  onCancel: () => void;
  existingDates?: string[]; // To prevent duplicates in CREATE mode
  isEditing?: boolean;
}

const EMPTY_PROJECT: ProjectEntry = {
  id: '',
  projectName: '',
  taskDetails: '',
  workingHours: 0,
};

export const RecordForm: React.FC<RecordFormProps> = ({
  initialData,
  developerName,
  onSave,
  onCancel,
  existingDates = [],
  isEditing = false,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [projects, setProjects] = useState<ProjectEntry[]>([
    { ...EMPTY_PROJECT, id: Date.now().toString() }
  ]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setProjects(initialData.projects.length > 0 ? initialData.projects : [{ ...EMPTY_PROJECT, id: Date.now().toString() }]);
      setNotes(initialData.notes);
    }
  }, [initialData]);

  const handleProjectChange = (index: number, field: keyof ProjectEntry, value: string | number) => {
    const newProjects = [...projects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    setProjects(newProjects);
  };

  const addProject = () => {
    if (projects.length >= 4) return;
    setProjects([...projects, { ...EMPTY_PROJECT, id: Date.now().toString() + Math.random() }]);
  };

  const removeProject = (index: number) => {
    const newProjects = projects.filter((_, i) => i !== index);
    setProjects(newProjects);
  };

  const totalHours = calculateTotalHours(projects);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!date) return setError('Date is required.');
    
    // Check duplicate date only if creating new record
    if (!isEditing && existingDates.includes(date)) {
        return setError('A record for this date already exists. Please edit the existing record.');
    }

    const validProjects = projects.filter(p => p.projectName.trim() !== '' || p.taskDetails.trim() !== '' || p.workingHours > 0);
    
    if (validProjects.length === 0) {
      return setError('At least one project must be filled out.');
    }

    const hasInvalidProject = validProjects.some(p => !p.projectName.trim() || !p.taskDetails.trim() || p.workingHours <= 0);
    if (hasInvalidProject) {
        return setError('All project fields (Name, Details, Hours > 0) must be completed for active entries.');
    }

    const record: WorkRecord = {
      id: initialData?.id || crypto.randomUUID(),
      developerName: initialData?.developerName || developerName,
      date,
      month: date.slice(0, 7),
      projects: validProjects,
      totalProjects: validProjects.length,
      totalHours,
      notes,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(record);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Record' : 'New Daily Record'}</h2>
        <button type="button" onClick={onCancel} className="text-slate-500 hover:text-slate-700">
          <X size={24} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Developer Name</label>
          <input
            type="text"
            value={initialData?.developerName || developerName}
            disabled
            className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-600 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            required
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-slate-700">Projects (Max 4)</label>
          <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
            Total: {totalHours.toFixed(1)} hrs
          </span>
        </div>
        
        <div className="space-y-4">
          {projects.map((project, index) => (
            <div key={project.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative group">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                 <div className="md:col-span-4">
                    <label className="block text-xs text-slate-500 mb-1">Project Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Website Redesign"
                        value={project.projectName}
                        onChange={(e) => handleProjectChange(index, 'projectName', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500"
                    />
                 </div>
                 <div className="md:col-span-6">
                    <label className="block text-xs text-slate-500 mb-1">Task Details</label>
                    <input
                        type="text"
                        placeholder="What did you do?"
                        value={project.taskDetails}
                        onChange={(e) => handleProjectChange(index, 'taskDetails', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500"
                    />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Hours</label>
                    <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={project.workingHours}
                        onChange={(e) => handleProjectChange(index, 'workingHours', parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500"
                    />
                 </div>
              </div>
              
              {projects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProject(index)}
                    className="absolute -top-2 -right-2 bg-white text-red-500 p-1 rounded-full shadow border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Project"
                  >
                    <Trash2 size={14} />
                  </button>
              )}
            </div>
          ))}
        </div>

        {projects.length < 4 && (
            <button
                type="button"
                onClick={addProject}
                className="mt-3 flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
                <Plus size={16} className="mr-1" /> Add Another Project
            </button>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          placeholder="Any blockers or additional context..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors flex items-center"
        >
          <Save size={18} className="mr-2" />
          Save Record
        </button>
      </div>
    </form>
  );
};
