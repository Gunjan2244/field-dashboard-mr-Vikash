export type Role = 'admin' | 'employee';

export interface District {
  id: string;
  name: string;
}

export interface MetricField {
  id: string;
  projectId: string;
  key: string; // machine key, unique within a project, used inside DailyEntry.metrics
  label: string;
  sortOrder: number;
}

export interface Project {
  id: string;
  districtId: string;
  name: string;
  metricFields: MetricField[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  districtId: string | null;
  status: 'active' | 'inactive';
}

export interface DailyEntry {
  id: string;
  userId: string;
  districtId: string;
  projectId: string;
  date: string; // ISO yyyy-mm-dd
  metrics: Record<string, number>; // keyed by MetricField.key, fully dynamic per project
  updatedAt: string;
}
