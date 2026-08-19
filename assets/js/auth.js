// Lightweight helper to handle Google credential response and session storage
// Updated to call server-side verification endpoint /api/auth/google

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

  // Try server-side verification first
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
      // on register flow, you might want to prefill and return to register page
      window.location.href = '/gemini.html';
    } else {
      window.location.href = '/gemini.html';
    }
    return;
  } catch (err) {
    console.error('Server verification failed, falling back to client-side storage:', err);
    // fallback: store locally (non-secure) and continue
    localStorage.setItem('google_id_token', idToken);
    localStorage.setItem('google_user', JSON.stringify(user));
    if (options.after === 'register') {
      // prefill register fields if present
      const nameEl = document.getElementById('fullname');
      const emailEl = document.getElementById('regEmail');
      if (nameEl && user.name) nameEl.value = user.name;
      if (emailEl && user.email) emailEl.value = user.email;
      return;
    }
    window.location.href = '/gemini.html';
  }
};

// Optional: helper to sign out (client-only)
window.googleSignOut = function() {
  localStorage.removeItem('google_id_token');
  localStorage.removeItem('google_user');
  localStorage.removeItem('isLoggedIn');
  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }
  // also call server signout endpoint if you implement it
  window.location.href = '/';
};
