// Vercel Serverless Function - verify Google ID token and set HttpOnly session cookie
const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // set this in Vercel env
const client = new OAuth2Client(CLIENT_ID);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // ensure JSON body
    const body = req.body || {};
    const id_token = body.id_token;
    if (!id_token) return res.status(400).json({ error: 'Missing id_token' });

    if (!CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID not set in environment');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload(); // contains email, name, sub, picture, etc.

    // TODO: Lookup or create a user in your DB using payload.sub or payload.email
    const session = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      iat: Date.now(),
    };

    // Very simple session cookie (for demo). In production sign and/or store server-side.
    const cookieValue = Buffer.from(JSON.stringify(session)).toString('base64');

    // Set HttpOnly, Secure cookie. SameSite=Lax helps with basic flow.
    // Secure flag requires HTTPS in production. Vercel provides HTTPS by default.
    res.setHeader('Set-Cookie', `session=${cookieValue}; HttpOnly; Path=/; Max-Age=${7*24*3600}; SameSite=Lax; Secure`);

    return res.status(200).json({ ok: true, email: payload.email, name: payload.name });
  } catch (err) {
    console.error('Google token verification failed', err);
    return res.status(401).json({ error: 'Invalid ID token' });
  }
};