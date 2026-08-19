export type Role = 'admin' | 'employee';

export interface District {
  id: string;
  name: string;
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
  date: string; // ISO yyyy-mm-dd
  schoolsObserved: number;
  classesObserved: number;
  studentsAttended: number;
  teachersObserved: number;
  fieldVisits: number;
  storiesRead: number;
  seelDone: number;
  updatedAt: string;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
}

export const METRIC_FIELDS: { key: keyof DailyEntry; label: string }[] = [
  { key: 'schoolsObserved', label: 'Schools Observed' },
  { key: 'classesObserved', label: 'Classes Observed' },
  { key: 'studentsAttended', label: 'Students Attended' },
  { key: 'teachersObserved', label: 'Teachers Observed' },
  { key: 'fieldVisits', label: 'Field Visits' },
  { key: 'storiesRead', label: 'Stories Read' },
  { key: 'seelDone', label: 'SEEL Done' },
];
