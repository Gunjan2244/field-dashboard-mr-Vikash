# Field Monitoring Dashboard — Preview Build

Vite + React + TypeScript app implementing the plan: employee daily entry (7 metrics),
2-day edit lock, leave requests, and an admin dashboard with employee/district/cumulative
charts across daily/weekly/monthly/up-to-date views.

## Run locally

```
npm install
npm run dev
```

## Current state

- **Data layer is mocked** (`src/lib/mockData.ts`) with ~90 days of realistic sample data
  across 3 districts and 9 employees, so the dashboard is fully interactive out of the box.
- **Auth is a simplified mock** (`src/context/AuthContext.tsx`) — sign in with any of the
  demo emails shown on the login screen, any password. Swap this for real Supabase auth
  when the backend is ready.
- **Supabase client stub** is in `src/lib/supabaseClient.ts`, ready for real credentials.

## Demo accounts (any password)

- `admin@org.in` — Admin
- `ravi.k@org.in` — Employee, Patna
- `priya.s@org.in` — Employee, Gaya
- `deepak.p@org.in` — Employee, Muzaffarpur

## Next step: wiring Supabase

1. Create a Supabase project, create tables matching `src/lib/types.ts`
   (`users`, `districts`, `daily_entries`, `leave_requests`).
2. Add Row Level Security policies:
   - Employees can insert/update their own `daily_entries` only where
     `date >= current_date - interval '2 days'`.
   - Admins bypass this restriction.
3. Replace the functions in `src/lib/mockData.ts` with real Supabase queries — page
   components don't need to change, they just consume the same shapes.
