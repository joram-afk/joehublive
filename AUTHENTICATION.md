# Google Sign-In setup for this site

This repository includes example login and register pages with a client-side Google Sign-In integration using Google Identity Services.

Before the Google button will work, you must create a Google OAuth Client ID and add it to the pages.

Steps:

1. Go to https://console.cloud.google.com/apis/credentials (you may need to create a Google Cloud project first).
2. Create credentials → OAuth client ID → Web application.
3. Under "Authorized JavaScript origins" add the site origin(s):
   - https://joram-afk.github.io
   - http://localhost:5500  (optional for local testing)
4. Save and copy the Client ID.
5. Edit `login.html` and `register.html` and replace the placeholder `YOUR_GOOGLE_CLIENT_ID` with your actual client id (a string that starts with digits and ends with `.apps.googleusercontent.com`).

Security note:
- This example performs client-side handling of the ID token for convenience on static sites. For any protected operations you must send the ID token to a server and verify it with Google (see https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).

Files added:
- `login.html` — login page with Google Sign-In button (placeholder client id)
- `register.html` — registration page that prefills fields from Google account
- `assets/js/auth.js` — helper to parse the ID token and store a client-side session

If you want, I can update the pages to read the client ID from `assets/js/auth.js` instead of inlining it in both files, or I can add a small server example (Node/Express or Python/Flask) to verify tokens. Open an issue or PR request if you'd like those changes.
