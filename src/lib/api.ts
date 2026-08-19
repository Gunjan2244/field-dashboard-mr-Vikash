import { supabase } from './supabaseClient';
import { District, User, Role, DailyEntry, LeaveRequest, LeaveStatus } from './types';

// ============================================================
// Row <-> app-type mappers (DB uses snake_case, app uses camelCase)
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDistrict(row: any): District {
  return { id: row.id, name: row.name };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as Role,
    districtId: row.district_id,
    status: row.status,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEntry(row: any): DailyEntry {
  return {
    id: row.id,
    userId: row.user_id,
    districtId: row.district_id,
    date: row.entry_date,
    schoolsObserved: row.schools_observed,
    classesObserved: row.classes_observed,
    studentsAttended: row.students_attended,
    teachersObserved: row.teachers_observed,
    fieldVisits: row.field_visits,
    storiesRead: row.stories_read,
    seelDone: row.seel_done,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToLeave(row: any): LeaveRequest {
  return {
    id: row.id,
    userId: row.user_id,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason,
    status: row.status as LeaveStatus,
    appliedAt: row.applied_at,
  };
}

export { rowToUser };

// ============================================================
// Profile (used by AuthContext right after sign-in)
// ============================================================

export async function getProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? rowToUser(data) : null;
}

// ============================================================
// Districts
// ============================================================

export async function getDistricts(): Promise<District[]> {
  const { data, error } = await supabase.from('districts').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(rowToDistrict);
}

// ============================================================
// Employees (admin-only in practice — RLS enforces this regardless of UI)
// ============================================================

export async function getEmployees(): Promise<User[]> {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'employee').order('name');
  if (error) throw error;
  return (data ?? []).map(rowToUser);
}

export async function updateEmployee(
  id: string,
  patch: { districtId?: string | null; status?: 'active' | 'inactive' }
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {};
  if (patch.districtId !== undefined) payload.district_id = patch.districtId;
  if (patch.status !== undefined) payload.status = patch.status;
  const { error } = await supabase.from('profiles').update(payload).eq('id', id);
  if (error) throw error;
}

// ============================================================
// Daily entries
// ============================================================

export async function getEntries(
  opts: { userId?: string; districtId?: string; since?: string } = {}
): Promise<DailyEntry[]> {
  let q = supabase.from('daily_entries').select('*');
  if (opts.userId) q = q.eq('user_id', opts.userId);
  if (opts.districtId) q = q.eq('district_id', opts.districtId);
  if (opts.since) q = q.gte('entry_date', opts.since);
  const { data, error } = await q.order('entry_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToEntry);
}

export async function getEntryForDate(userId: string, date: string): Promise<DailyEntry | null> {
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', date)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToEntry(data) : null;
}

export interface EntryInput {
  userId: string;
  districtId: string;
  date: string;
  schoolsObserved: number;
  classesObserved: number;
  studentsAttended: number;
  teachersObserved: number;
  fieldVisits: number;
  storiesRead: number;
  seelDone: number;
}

/**
 * Insert or update today's/recent entry. Note: the 2-day edit window is
 * enforced server-side by RLS policies — this call will fail with a
 * permissions error if the date is outside that window, regardless of what
 * the UI allows.
 */
export async function upsertEntry(entry: EntryInput): Promise<void> {
  const { error } = await supabase.from('daily_entries').upsert(
    {
      user_id: entry.userId,
      district_id: entry.districtId,
      entry_date: entry.date,
      schools_observed: entry.schoolsObserved,
      classes_observed: entry.classesObserved,
      students_attended: entry.studentsAttended,
      teachers_observed: entry.teachersObserved,
      field_visits: entry.fieldVisits,
      stories_read: entry.storiesRead,
      seel_done: entry.seelDone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,entry_date' }
  );
  if (error) throw error;
}

// ============================================================
// Leave requests
// ============================================================

export async function getLeaveRequests(opts: { userId?: string } = {}): Promise<LeaveRequest[]> {
  let q = supabase.from('leave_requests').select('*');
  if (opts.userId) q = q.eq('user_id', opts.userId);
  const { data, error } = await q.order('applied_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToLeave);
}

export async function createLeaveRequest(req: {
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
}): Promise<void> {
  const { error } = await supabase.from('leave_requests').insert({
    user_id: req.userId,
    start_date: req.startDate,
    end_date: req.endDate,
    reason: req.reason,
    status: 'pending',
  });
  if (error) throw error;
}

export async function updateLeaveStatus(id: string, status: LeaveStatus): Promise<void> {
  const { error } = await supabase.from('leave_requests').update({ status }).eq('id', id);
  if (error) throw error;
}
