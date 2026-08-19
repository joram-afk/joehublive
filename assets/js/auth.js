// Lightweight helper to handle Google credential response and session storage
// Usage: include this file and call google.accounts.id.initialize(...) with callback `handleCredentialResponse`
// Replace any redirects/logic to match your site

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
window.handleGoogleCredential = function(response, options = { after: 'login' }) {
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

  // Save token & user (client-side). For production, send idToken to server for verification.
  localStorage.setItem('google_id_token', idToken);
  localStorage.setItem('google_user', JSON.stringify(user));

  // If on register flow, prefill registration fields if present
  if (options.after === 'register') {
    const nameEl = document.getElementById('fullname');
    const emailEl = document.getElementById('regEmail');
    if (nameEl && user.name) nameEl.value = user.name;
    if (emailEl && user.email) emailEl.value = user.email;
    // Optionally, you can auto-submit register form or show a message:
    // document.getElementById('registerForm').submit();
    return;
  }

  // Default login flow: redirect or set UI state
  // Example: set local logged-in flag and go to home
  localStorage.setItem('isLoggedIn', '1');
  window.location.href = '/'; // change to your post-login page
};

// Optional: helper to sign out (client-only)
window.googleSignOut = function() {
  localStorage.removeItem('google_id_token');
  localStorage.removeItem('google_user');
  localStorage.removeItem('isLoggedIn');
  // Revoke token client-side is not fully sufficient; to revoke you should use OAuth revoke endpoint server-side.
  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }
  window.location.href = '/';
};
