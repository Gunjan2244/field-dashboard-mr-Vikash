import { supabase } from './supabaseClient';
import { District, User, Role, Project, MetricField, DailyEntry } from './types';

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
function rowToMetricField(row: any): MetricField {
  return {
    id: row.id,
    projectId: row.project_id,
    key: row.key,
    label: row.label,
    sortOrder: row.sort_order,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProject(row: any): Project {
  return {
    id: row.id,
    districtId: row.district_id,
    name: row.name,
    metricFields: (row.project_metric_fields ?? [])
      .map(rowToMetricField)
      .sort((a: MetricField, b: MetricField) => a.sortOrder - b.sortOrder),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEntry(row: any): DailyEntry {
  return {
    id: row.id,
    userId: row.user_id,
    districtId: row.district_id,
    projectId: row.project_id,
    date: row.entry_date,
    metrics: row.metrics ?? {},
    updatedAt: row.updated_at,
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
// Districts (admin-defined)
// ============================================================

export async function getDistricts(): Promise<District[]> {
  const { data, error } = await supabase.from('districts').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(rowToDistrict);
}

export async function createDistrict(name: string): Promise<District> {
  const { data, error } = await supabase.from('districts').insert({ name }).select('*').single();
  if (error) throw error;
  return rowToDistrict(data);
}

export async function updateDistrict(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('districts').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function deleteDistrict(id: string): Promise<void> {
  const { error } = await supabase.from('districts').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// Projects (admin-defined, each belongs to one district, each has its
// own fully dynamic set of metric fields)
// ============================================================

const PROJECT_SELECT = '*, project_metric_fields(*)';

export async function getProjects(opts: { districtId?: string } = {}): Promise<Project[]> {
  let q = supabase.from('projects').select(PROJECT_SELECT);
  if (opts.districtId) q = q.eq('district_id', opts.districtId);
  const { data, error } = await q.order('name');
  if (error) throw error;
  return (data ?? []).map(rowToProject);
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase.from('projects').select(PROJECT_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? rowToProject(data) : null;
}

export async function createProject(districtId: string, name: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ district_id: districtId, name })
    .select(PROJECT_SELECT)
    .single();
  if (error) throw error;
  return rowToProject(data);
}

export async function updateProject(id: string, patch: { name?: string; districtId?: string }): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.districtId !== undefined) payload.district_id = patch.districtId;
  const { error } = await supabase.from('projects').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ------------------------------------------------------------
// Metric fields — fully dynamic, defined per-project by the admin
// ------------------------------------------------------------

export async function createMetricField(projectId: string, key: string, label: string, sortOrder = 0): Promise<MetricField> {
  const { data, error } = await supabase
    .from('project_metric_fields')
    .insert({ project_id: projectId, key, label, sort_order: sortOrder })
    .select('*')
    .single();
  if (error) throw error;
  return rowToMetricField(data);
}

export async function updateMetricField(id: string, patch: { label?: string; sortOrder?: number }): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {};
  if (patch.label !== undefined) payload.label = patch.label;
  if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder;
  const { error } = await supabase.from('project_metric_fields').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteMetricField(id: string): Promise<void> {
  const { error } = await supabase.from('project_metric_fields').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// Employees — admin creates users, changes passwords, deletes them,
// and assigns a district. These mutate auth.users, so they run through
// the `admin-users` edge function using the service role key server-side.
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

async function callAdminUsers<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body: { action, ...payload } });
  if (error) {
    // Prefer the JSON error message the function returned, if any.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const context = (error as any)?.context;
    const detail = context && typeof context.json === 'function' ? await context.json().catch(() => null) : null;
    throw new Error(detail?.error ?? error.message ?? 'Request failed.');
  }
  return data as T;
}

export async function createEmployee(input: {
  name: string;
  email: string;
  password: string;
  districtId: string | null;
}): Promise<User> {
  const data = await callAdminUsers<{ profile: unknown }>('create', input);
  return rowToUser(data.profile);
}

export async function setEmployeePassword(id: string, password: string): Promise<void> {
  await callAdminUsers('set_password', { id, password });
}

export async function deleteEmployee(id: string): Promise<void> {
  await callAdminUsers('delete', { id });
}

// ============================================================
// Daily entries — one per employee per date, employee picks the project
// for that date; the metric values are whatever fields that project defines.
// ============================================================

export async function getEntries(
  opts: { userId?: string; districtId?: string; projectId?: string; since?: string } = {}
): Promise<DailyEntry[]> {
  let q = supabase.from('daily_entries').select('*');
  if (opts.userId) q = q.eq('user_id', opts.userId);
  if (opts.districtId) q = q.eq('district_id', opts.districtId);
  if (opts.projectId) q = q.eq('project_id', opts.projectId);
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
  projectId: string;
  date: string;
  metrics: Record<string, number>;
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
      project_id: entry.projectId,
      entry_date: entry.date,
      metrics: entry.metrics,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,entry_date' }
  );
  if (error) throw error;
}
