import { WorkRecord, ProjectEntry } from '../types';

const STORAGE_KEY = 'daily_project_tracker_data';

const MOCK_DATA: WorkRecord[] = [
  {
    id: '1',
    developerName: 'John Doe',
    date: new Date().toISOString().split('T')[0],
    month: new Date().toISOString().slice(0, 7),
    projects: [
      { id: 'p1', projectName: 'Frontend Revamp', taskDetails: 'Implemented new Tailwind config', workingHours: 4 },
      { id: 'p2', projectName: 'API Integration', taskDetails: 'Connected auth endpoints', workingHours: 3.5 },
    ],
    totalProjects: 2,
    totalHours: 7.5,
    notes: 'Blocked on backend migration for user settings.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    developerName: 'Jane Smith',
    date: new Date().toISOString().split('T')[0],
    month: new Date().toISOString().slice(0, 7),
    projects: [
      { id: 'p3', projectName: 'Database Migration', taskDetails: 'Schema updates', workingHours: 6 },
    ],
    totalProjects: 1,
    totalHours: 6,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const getRecords = (): WorkRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    // Initialize with mock data if empty
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DATA));
    return MOCK_DATA;
  }
  return JSON.parse(data);
};

export const saveRecord = (record: WorkRecord): void => {
  const records = getRecords();
  const existingIndex = records.findIndex((r) => r.id === record.id);
  
  if (existingIndex >= 0) {
    records[existingIndex] = { ...record, updatedAt: new Date().toISOString() };
  } else {
    records.push({ ...record, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const deleteRecord = (id: string): void => {
  const records = getRecords();
  const newRecords = records.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
};

export const calculateTotalHours = (projects: ProjectEntry[]): number => {
  return projects.reduce((sum, p) => sum + (Number(p.workingHours) || 0), 0);
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
      `"${r.notes.replace(/"/g, '""')}"`, // Escape quotes
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
