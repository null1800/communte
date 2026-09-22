# Development Workflow

Required checks for every change are shared-type build, API type check/build, web type check/build, lint, and focused unit/integration tests. Integration tests must use a disposable database with migrations applied; mocks may replace external payment/SMS providers but not the database transaction or authorization logic.

Use a feature branch, open a pull request, deploy migrations before application code that depends on them, smoke-test staging, then deploy. Production credentials belong only in managed environment configuration; commit `.env.example` values without secrets.

## Supabase Setup

### 1. Create environment files

```powershell
# API — fill in your values after copying
Copy-Item apps\api\.env.example apps\api\.env

# Web
Copy-Item apps\web\.env.example apps\web\.env.local
```

Values you need from **Supabase Dashboard → Settings → API**:

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret — never expose in browser) |
| `JWT_SECRET` | Settings → API → JWT Secret |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key |

### 2. Link project and push migrations

```powershell
# Link to your remote Supabase project (run once)
npx supabase link --project-ref <your-project-ref>

# Push all migrations (runs 0000–0006 in order)
npx supabase db push
```

You will be prompted for your **database password** (set when you created the project; reset it at Settings → Database if needed).

### 3. Start development servers

```powershell
# Terminal 1 — NestJS API (reads apps/api/.env automatically via dotenv in main.ts)
npm run start:dev --workspace=@communte/api

# Terminal 2 — Next.js web
npm run dev --workspace=@communte/web
```

### 4. Issue a development bearer token

With `AUTH_DEV_MODE=true` in `apps/api/.env`, you can get a token without an OTP flow:

```powershell
# Replace <your-user-uuid> with a real UUID from the users table
$body = '{"userId":"<your-user-uuid>","roles":["CUSTOMER"]}'
Invoke-RestMethod -Method Post -Uri http://localhost:3001/v1/auth/development-token `
  -ContentType "application/json" -Body $body
```

Use the returned `accessToken` as `Authorization: Bearer <token>` on subsequent API calls.

### 5. Verify connectivity

```powershell
# Liveness (no auth required)
Invoke-RestMethod http://localhost:3001/v1/health/live

# Readiness (checks DB connection)
Invoke-RestMethod http://localhost:3001/v1/health/ready
```

`ready` returning `200` confirms the API can reach Supabase with the service role key.
