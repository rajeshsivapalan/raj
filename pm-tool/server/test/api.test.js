import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { seed } from '../src/seed.js';

let mongo, server, base, ids;
process.env.JWT_SECRET = 'test-secret';

before(async () => {
  // Use TEST_MONGO_URI (e.g. a local/Docker Mongo) if set, else an in-memory server.
  if (process.env.TEST_MONGO_URI) {
    await mongoose.connect(process.env.TEST_MONGO_URI);
    await mongoose.connection.dropDatabase();
  } else {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }
  ids = await seed();
  server = createApp().listen(0);
  base = `http://localhost:${server.address().port}/api`;
});
after(async () => {
  server.close();
  if (process.env.TEST_MONGO_URI) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongo?.stop();
});

async function call(method, path, token, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}
const login = async (email) => (await call('POST', '/auth/login', null, { email, password: 'Welcome@123' })).body.token;

test('login rejects a bad password', async () => {
  const r = await call('POST', '/auth/login', null, { email: 'admin@btpl.local', password: 'nope' });
  assert.equal(r.status, 401);
});

test('employee sees only own logs and assigned projects', async () => {
  const t = await login('meena@btpl.local');
  const logs = await call('GET', '/logs', t);
  assert.equal(logs.status, 200);
  assert.ok(logs.body.every((l) => l.user.name === 'Meena QA'));
  const projects = await call('GET', '/projects', t);
  assert.deepEqual(projects.body.map((p) => p.code), ['CPR']);
});

test('employee cannot log on a project they are not on, or in the future', async () => {
  const t = await login('meena@btpl.local');
  let r = await call('POST', '/logs', t, { project: ids.p2._id, hours: 1, task: 'x' });
  assert.equal(r.status, 400);
  r = await call('POST', '/logs', t, { project: ids.p1._id, hours: 1, task: 'x', date: '2999-01-01' });
  assert.equal(r.status, 400);
  r = await call('POST', '/logs', t, { project: ids.p1._id, hours: 1.5, task: 'Test plan review' });
  assert.equal(r.status, 201);
});

test('employee cannot edit someone else\'s entry', async () => {
  const arun = await login('arun@btpl.local');
  const meena = await login('meena@btpl.local');
  const mine = (await call('GET', '/logs', arun)).body[0];
  const r = await call('PUT', `/logs/${mine._id}`, meena, { hours: 9 });
  assert.equal(r.status, 403);
});

test('employee blocked from dashboard and admin routes', async () => {
  const t = await login('arun@btpl.local');
  assert.equal((await call('GET', '/dashboard', t)).status, 403);
  assert.equal((await call('POST', '/projects', t, { name: 'X', code: 'X' })).status, 403);
});

test('lead dashboard shows hours, blockers and who has not logged', async () => {
  const t = await login('lead@btpl.local');
  const r = await call('GET', '/dashboard', t);
  assert.equal(r.status, 200);
  assert.equal(r.body.summary.teamSize, 2);
  assert.equal(r.body.summary.loggedCount, 2);
  assert.equal(r.body.blockers.length, 1);
  assert.equal(r.body.trend.length, 7);
});

test('admin can create a user and a project', async () => {
  const t = await login('admin@btpl.local');
  const u = await call('POST', '/users', t, { name: 'New Hire', email: 'new@btpl.local', password: 'Welcome@123' });
  assert.equal(u.status, 201);
  assert.equal(u.body.passwordHash, undefined);
  const p = await call('POST', '/projects', t, { name: 'Website', code: 'web', members: [u.body._id] });
  assert.equal(p.status, 201);
  assert.equal(p.body.code, 'WEB');
});
