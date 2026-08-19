import { District, User, DailyEntry, LeaveRequest } from './types';

// ============================================================
// MOCK DATA LAYER
// This module stands in for Supabase during UI development.
// Swap the functions in `lib/api.ts` to call `supabase.from(...)`
// instead of these in-memory generators — the rest of the app
// (components, charts, pages) does not need to change.
// ============================================================

export const districts: District[] = [
  { id: 'd1', name: 'Patna' },
  { id: 'd2', name: 'Gaya' },
  { id: 'd3', name: 'Muzaffarpur' },
];

export const users: User[] = [
  { id: 'admin1', name: 'You (Admin)', email: 'admin@org.in', role: 'admin', districtId: null, status: 'active' },
  { id: 'u1', name: 'Ravi Kumar', email: 'ravi.k@org.in', role: 'employee', districtId: 'd1', status: 'active' },
  { id: 'u2', name: 'Sunita Devi', email: 'sunita.d@org.in', role: 'employee', districtId: 'd1', status: 'active' },
  { id: 'u3', name: 'Amit Singh', email: 'amit.s@org.in', role: 'employee', districtId: 'd1', status: 'active' },
  { id: 'u4', name: 'Priya Sharma', email: 'priya.s@org.in', role: 'employee', districtId: 'd2', status: 'active' },
  { id: 'u5', name: 'Manoj Yadav', email: 'manoj.y@org.in', role: 'employee', districtId: 'd2', status: 'active' },
  { id: 'u6', name: 'Kavita Roy', email: 'kavita.r@org.in', role: 'employee', districtId: 'd2', status: 'active' },
  { id: 'u7', name: 'Deepak Prasad', email: 'deepak.p@org.in', role: 'employee', districtId: 'd3', status: 'active' },
  { id: 'u8', name: 'Neha Kumari', email: 'neha.k@org.in', role: 'employee', districtId: 'd3', status: 'active' },
  { id: 'u9', name: 'Sanjay Thakur', email: 'sanjay.t@org.in', role: 'employee', districtId: 'd3', status: 'active' },
];

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateEntries(): DailyEntry[] {
  const entries: DailyEntry[] = [];
  const today = new Date();
  const employees = users.filter((u) => u.role === 'employee');

  employees.forEach((emp, empIdx) => {
    const rand = seededRandom(empIdx + 7);
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const day = date.getDay();
      if (day === 0) continue; // skip Sundays — no entry (mirrors real absence)
      if (rand() < 0.06) continue; // occasional gap (leave / missed day)

      const schools = Math.round(1 + rand() * 3);
      const classes = schools + Math.round(rand() * 4);
      entries.push({
        id: `${emp.id}-${iso(date)}`,
        userId: emp.id,
        districtId: emp.districtId as string,
        date: iso(date),
        schoolsObserved: schools,
        classesObserved: classes,
        studentsAttended: classes * Math.round(18 + rand() * 12),
        teachersObserved: Math.round(classes * (0.6 + rand() * 0.4)),
        fieldVisits: Math.round(rand() * 3),
        storiesRead: Math.round(rand() * 2),
        seelDone: Math.round(rand() * 2),
        updatedAt: `${iso(date)}T10:00:00Z`,
      });
    }
  });
  return entries;
}

export const dailyEntries: DailyEntry[] = generateEntries();

export const leaveRequests: LeaveRequest[] = [
  { id: 'l1', userId: 'u2', startDate: iso(daysAgo(2)), endDate: iso(daysAgo(1)), reason: 'Family function', status: 'pending', appliedAt: iso(daysAgo(4)) },
  { id: 'l2', userId: 'u5', startDate: iso(daysAgo(10)), endDate: iso(daysAgo(9)), reason: 'Medical', status: 'approved', appliedAt: iso(daysAgo(12)) },
  { id: 'l3', userId: 'u7', startDate: iso(daysAgo(20)), endDate: iso(daysAgo(19)), reason: 'Personal', status: 'rejected', appliedAt: iso(daysAgo(22)) },
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function isEditable(dateStr: string): boolean {
  const entryDate = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - entryDate.getTime()) / 86400000);
  return diffDays <= 2; // today, yesterday, day before
}
