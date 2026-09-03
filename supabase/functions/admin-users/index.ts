// Supabase Edge Function: admin-users
//
// Handles account lifecycle actions that require the Supabase service role
// (creating an auth user, setting a password, deleting a user) — actions
// that can never be done safely from the browser since they'd require
// shipping the service role key to the client.
//
// The caller's JWT is verified and their `profiles.role` must be 'admin'
// before anything happens. Deploy with:
//   supabase functions deploy admin-users
//
// Required secrets (already present in every Supabase project by default):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'Missing Authorization header.' }, 401);

    // Client scoped to the caller's own JWT — used only to find out who they are.
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
      error: callerErr,
    } = await callerClient.auth.getUser();
    if (callerErr || !caller) return json({ error: 'Not authenticated.' }, 401);

    // Service-role client — bypasses RLS, used for the actual admin operation.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: callerProfile, error: profileErr } = await admin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle();
    if (profileErr) return json({ error: profileErr.message }, 500);
    if (!callerProfile || callerProfile.role !== 'admin') {
      return json({ error: 'Only admins can manage employee accounts.' }, 403);
    }

    const body = await req.json();
    const action = body.action as string;

    if (action === 'create') {
      const { name, email, password, districtId } = body as {
        name: string; email: string; password: string; districtId: string | null;
      };
      if (!name?.trim() || !email?.trim() || !password) {
        return json({ error: 'name, email, and password are required.' }, 400);
      }
      if (password.length < 8) return json({ error: 'Password must be at least 8 characters.' }, 400);

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
      });
      if (createErr || !created.user) return json({ error: createErr?.message ?? 'Could not create the account.' }, 400);

      const { data: profile, error: insertErr } = await admin
        .from('profiles')
        .insert({
          id: created.user.id,
          name: name.trim(),
          email: email.trim(),
          role: 'employee',
          district_id: districtId ?? null,
          status: 'active',
        })
        .select('*')
        .single();

      if (insertErr) {
        // Roll back the auth user so we don't leave an orphaned login.
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: insertErr.message }, 400);
      }

      return json({ profile });
    }

    if (action === 'set_password') {
      const { id, password } = body as { id: string; password: string };
      if (!id || !password) return json({ error: 'id and password are required.' }, 400);
      if (password.length < 8) return json({ error: 'Password must be at least 8 characters.' }, 400);

      const { error: updateErr } = await admin.auth.admin.updateUserById(id, { password });
      if (updateErr) return json({ error: updateErr.message }, 400);
      return json({ ok: true });
    }

    if (action === 'delete') {
      const { id } = body as { id: string };
      if (!id) return json({ error: 'id is required.' }, 400);
      if (id === caller.id) return json({ error: "You can't delete your own account." }, 400);

      // Profile row first (daily_entries.user_id references profiles, not
      // auth.users directly in most setups — deleting the auth user cascades
      // to the profile if you've set that FK to ON DELETE CASCADE; deleting
      // the profile explicitly here makes this safe either way).
      await admin.from('profiles').delete().eq('id', id);
      const { error: deleteErr } = await admin.auth.admin.deleteUser(id);
      if (deleteErr) return json({ error: deleteErr.message }, 400);
      return json({ ok: true });
    }

    return json({ error: `Unknown action "${action}".` }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error.' }, 500);
  }
});
