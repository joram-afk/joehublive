// Lightweight helper to handle Google credential response and session storage
// Updated to support client-only flow on GitHub Pages (no server)

function parseJwt (token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Detect when running on GitHub Pages or localhost and skip server verification
const SKIP_SERVER_VERIFY = (typeof window !== 'undefined') && (
  window.location.hostname.endsWith('github.io') || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
);

// Shared handler: when Google returns credential response call this
// options: { after: 'login' | 'register' } to choose redirect/prefill behavior
window.handleGoogleCredential = async function(response, options = { after: 'login' }) {
  if (!response || !response.credential) {
    console.error('No credential in Google response', response);
    return;
  }
  const idToken = response.credential;
  const user = parseJwt(idToken);
  if (!user) {
    console.error('Failed to parse Google ID token');
    return;
  }

  // If running on GitHub Pages or explicitly opted-out server, store client-side only
  if (SKIP_SERVER_VERIFY) {
    try {
      localStorage.setItem('google_id_token', idToken);
      localStorage.setItem('google_user', JSON.stringify(user));
      // also set the app's expected userName/userEmail used by pages like gemini.html
      if (user.name) localStorage.setItem('userName', user.name);
      if (user.email) localStorage.setItem('userEmail', user.email);

      if (options.after === 'register') {
        // prefill register fields if present
        const nameEl = document.getElementById('fullname');
        const emailEl = document.getElementById('regEmail');
        if (nameEl && user.name) nameEl.value = user.name;
        if (emailEl && user.email) emailEl.value = user.email;
        return;
      }

      // redirect to post-login page
      window.location.href = '/gemini.html';
      return;
    } catch (e) {
      console.error('Local storage write failed', e);
      return;
    }
  }

  // Try server-side verification first (if available)
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      credentials: 'include', // important to receive/set cookies
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err && err.error ? err.error : 'Server rejected token');
    }

    // server set cookie; redirect to post-login page
    if (options.after === 'register') {
      window.location.href = '/gemini.html';
    } else {
      window.location.href = '/gemini.html';
    }
    return;
  } catch (err) {
    console.warn('Server verification failed or unavailable, falling back to client-only flow:', err);
    // fallback: store locally (non-secure) and continue
    try {
      localStorage.setItem('google_id_token', idToken);
      localStorage.setItem('google_user', JSON.stringify(user));
      if (user.name) localStorage.setItem('userName', user.name);
      if (user.email) localStorage.setItem('userEmail', user.email);

      if (options.after === 'register') {
        const nameEl = document.getElementById('fullname');
        const emailEl = document.getElementById('regEmail');
        if (nameEl && user.name) nameEl.value = user.name;
        if (emailEl && user.email) emailEl.value = user.email;
        return;
      }

      window.location.href = '/gemini.html';
    } catch (e) {
      console.error('Fallback local storage failed', e);
    }
  }
};

// Optional: helper to sign out (client-only)
window.googleSignOut = function() {
  localStorage.removeItem('google_id_token');
  localStorage.removeItem('google_user');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }
  window.location.href = '/login.html';
};
