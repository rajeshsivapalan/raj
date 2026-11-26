# BTPL Work Tracker (v0.1)

Daily work log and project tracker for BharathaTechno. MERN stack: MongoDB, Express, React (Vite), Node 20+.

## What it does

| Role | Can do |
|---|---|
| **Employee** | Log daily work (project, hours, task, status, blocker). Edit/delete own entries for 7 days. See own projects. |
| **Lead** | Everything an employee can, plus: dashboard and team logs for projects they lead, edit members/status of those projects, export CSV. |
| **Admin** | Everything, across all projects: create projects, assign leads, add/deactivate people, change roles, reset passwords. |

**Dashboard** (lead/admin): who has / hasn't logged today, hours by person, hours by project (today and 7 days), 7-day trend, open blockers.

## Run locally

```bash
cd pm-tool
npm run install:all
cp server/.env.example server/.env      # set MONGO_URI and JWT_SECRET
npm run seed                            # demo users + projects
npm run dev:server                      # API on :4000
npm run dev:client                      # UI on :5173 (proxies /api)
```

No local MongoDB? `docker run -d -p 27017:27017 mongo:7`, or use a free MongoDB Atlas cluster URI.

Demo logins (password `Welcome@123`): `admin@btpl.local`, `lead@btpl.local`, `arun@btpl.local`, `meena@btpl.local`.
**Change or remove these before going live.**

## Tests

```bash
npm test                                              # uses an in-memory MongoDB
TEST_MONGO_URI=mongodb://localhost:27017/btpl_test npm test   # or a real one
```

## Deploy (single service)

`npm run build` puts the React app in `client/dist`; the Express server serves it alongside `/api`, so one Node service is enough (Render, Railway, an EC2/VM with PM2, etc.).

```
build:  npm run install:all && npm run build
start:  npm start
env:    MONGO_URI, JWT_SECRET, APP_TZ (default Asia/Kolkata), LOG_EDIT_WINDOW_DAYS (default 7)
```

## Structure

```
server/src/models     User, Project, WorkLog
server/src/routes     auth, users, projects, logs, dashboard
server/src/scope.js   who-can-see-what rules
client/src/pages      Login, MyDay, Dashboard, TeamLogs, Projects, Team
```
