// auth.js - simple client-side auth helpers using the existing JSONBin backend
// WARNING: This is for demo purposes only. Storing a master key in client-side code is insecure.

const BIN_ID = '6958d60343b1c97be91604b3';
const MASTER_KEY = '$2a$10$fBoN5/ymnTgk71qgkEb4XOeT4Ge23eShhEZzIbEqqVsZ67KQeev8S';
const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

async function getCloud() {
  const res = await fetch(`${BIN_URL}/latest`, { headers: { 'X-Master-Key': MASTER_KEY } });
  if (!res.ok) throw new Error('Failed to fetch backend');
  const json = await res.json();
  return json.record;
}

async function updateCloud(newData) {
  const res = await fetch(BIN_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': MASTER_KEY },
    body: JSON.stringify(newData)
  });
  if (!res.ok) throw new Error('Failed to update backend');
  return res.json();
}

async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function registerUser({ name, email, password }) {
  if (!email || !password) throw new Error('Email and password required');
  const data = await getCloud();
  data.users = data.users || [];
  if (data.users.some(u => u.email === email)) throw new Error('A user with that email already exists');
  const pwdHash = await hashPassword(password);
  data.users.push({ name, email, pwdHash, createdAt: new Date().toISOString() });
  await updateCloud(data);
  return { name, email };
}

async function loginUser({ email, password }) {
  if (!email || !password) throw new Error('Email and password required');
  const data = await getCloud();
  data.users = data.users || [];
  const user = data.users.find(u => u.email === email);
  if (!user) throw new Error('User not found');
  const pwdHash = await hashPassword(password);
  if (pwdHash !== user.pwdHash) throw new Error('Invalid password');
  return { name: user.name, email: user.email };
}

// expose functions for pages
window.registerUser = registerUser;
window.loginUser = loginUser;
window.getCloud = getCloud;
window.updateCloud = updateCloud;
