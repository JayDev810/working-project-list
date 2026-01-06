export type Role = 'ADMIN' | 'MEMBER';

export interface ProjectEntry {
  id: string;
  projectName: string;
  taskDetails: string;
  workingHours: number;
}

export interface WorkRecord {
  id: string;
  developerName: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  projects: ProjectEntry[];
  totalProjects: number;
  totalHours: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface FilterState {
  month: string;
  developers: string[];
}
