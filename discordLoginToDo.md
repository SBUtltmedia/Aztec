# Discord Login Improvements To-Do

## Critical Security Fixes
- [x] **Implement Server-Side State Validation (CSRF Protection)**
    - **Issue:** The current implementation generates a `state` parameter on the client-side (`index.html`) and stores it in `localStorage`. When Discord redirects back to the server (`/`), the server receives the `code` and `state` but cannot verify the `state` because it doesn't have access to the client's `localStorage`.
    - **Fix:** Move state generation to the server.
        - Generate a random state string in the `/` handler (when no code is present).
        - Store it in `req.session.oauthState`.
        - Pass it to the view/template to be used in the "Log In" button URL.
        - On the callback (`/` with `code`), verify `req.query.state === req.session.oauthState`.

## Code Cleanup & Maintenance
- [x] **Remove Dead Client-Side Code**
    - **Issue:** `loginDiscord/index.html` contains `window.onload` logic that checks for `access_token` in `window.location.hash`.
    - **Context:** This is for the "Implicit Grant" flow. The server is currently implemented for the "Authorization Code" flow (`response_type=code`). The server intercepts the callback and renders the game, so the client-side JS in `index.html` never sees the callback parameters.
    - **Action:** Remove the `window.onload` script and the manual state generation in the client.

- [x] **Refactor Token Storage**
    - **Issue:** `refreshTokens` is a global object in `loginDiscord/index.js`.
    - **Risk:** This is a memory leak (entries never deleted) and won't work if the app scales to multiple processes/dynos.
    - **Action:** Store tokens in the user session (`req.session`) or a proper database if persistence is needed. *Update: Removed entirely as they were unnecessary.*

- [x] **Improve Error Handling**
    - **Issue:** The `try/catch` block in the oauth callback (`index.js`) swallows errors without user feedback (just reloads home).
    - **Action:** Log specific errors and potentially show a user-friendly error message or page.

## Configuration

- [ ] **Consolidate Config Logic**
    - **Issue:** Configuration is split between `config.json` checks and `process.env`.
    - **Action:** Standardize on a single configuration loader that handles both defaults and environment overrides cleanly.
