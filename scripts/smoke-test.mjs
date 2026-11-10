import assert from 'node:assert/strict';

const apiUrl = (process.env.API_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  const setCookies = response.headers.getSetCookie?.() ?? [];
  const cookie = setCookies
    .map((value) => value.split(';')[0])
    .filter(Boolean)
    .join('; ');

  return { status: response.status, body, cookie };
}

const health = await request('/api/health');
assert.equal(health.status, 200, 'health harus 200');
assert.equal(health.body.status, 'ok');
assert.equal(health.body.database, 'up');
console.log('✓ health');

const events = await request('/api/events');
assert.equal(events.status, 200, 'events harus 200');
assert.ok(Array.isArray(events.body), 'events harus array');
assert.ok(events.body.length >= 1, 'minimal satu event seed');
console.log(`✓ events (${events.body.length})`);

const login = await request('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'admin@eventkita.local',
    password: 'Admin12345!',
  }),
});
assert.equal(login.status, 200, 'login admin harus 200');
assert.equal(login.body.user.role, 'ADMIN');
assert.ok(login.cookie.includes('eventkita_session='), 'cookie sesi harus diset');
console.log('✓ login admin + cookie');

const me = await request('/api/auth/me', {
  headers: { Cookie: login.cookie },
});
assert.equal(me.status, 200, 'me harus 200');
assert.equal(me.body.user.email, 'admin@eventkita.local');
console.log('✓ auth/me');

const email = `smoke-${Date.now()}@example.com`;
const register = await request('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Smoke Test',
    email,
    password: 'SmokeTest123!',
  }),
});
assert.equal(register.status, 201, 'register harus 201');
assert.equal(register.body.user.role, 'PARTICIPANT');
assert.ok(register.cookie.includes('eventkita_session='), 'cookie register harus diset');
console.log('✓ register peserta');

const participantMe = await request('/api/auth/me', {
  headers: { Cookie: register.cookie },
});
assert.equal(participantMe.status, 200);
assert.equal(participantMe.body.user.email, email);
console.log('✓ sesi peserta');

const duplicate = await request('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Smoke Test',
    email,
    password: 'SmokeTest123!',
  }),
});
assert.equal(duplicate.status, 409, 'email duplikat harus 409');
console.log('✓ validasi email duplikat');

const invalidLogin = await request('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'admin@eventkita.local',
    password: 'salah-password',
  }),
});
assert.equal(invalidLogin.status, 401, 'password salah harus 401');
console.log('✓ validasi login salah');

const logout = await request('/api/auth/logout', {
  method: 'POST',
  headers: { Cookie: login.cookie },
});
assert.equal(logout.status, 200);
assert.equal(logout.body.ok, true);
console.log('✓ logout');

console.log('\nSmoke test selesai. Semua pemeriksaan lolos.');
