# Session-Based Authentication for Discord OAuth

**Date:** 2025-11-13
**Status:** Implemented

## Problem

Users had to re-authenticate with Discord every time they refreshed the page because:

1. **No session persistence**: Auth data was only stored in memory on the server
2. **sessionStorage cleared**: `sessionStorage.clear()` was called on every page load
3. **No cookies**: No client-side mechanism to maintain authentication state

## Solution

Implemented server-side session management using `express-session` with secure cookies.

### Changes Made

#### 1. Added Dependencies

```bash
npm install express-session cookie-parser
```

#### 2. Session Configuration (`loginDiscord/index.js`)

```javascript
// Configure session middleware
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'aztec-game-secret-' + Math.random().toString(36),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevents XSS attacks
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));
```

#### 3. Session Storage (`loginDiscord/index.js:156-161`)

After successful Discord OAuth:

```javascript
// Store user data in session for persistence across page refreshes
const userData = {
    gameState: webstackInstance.serverStore.getState(),
    authData: { ...guildResultJson, ...userResultJson }
};
request.session.userData = userData;
```

#### 4. Session Check (`loginDiscord/index.js:104-108`)

On page load, check for existing session:

```javascript
// Check if user already has a valid session
if (request.session && request.session.userData && !code) {
    // User has existing session, return Twine with saved data
    return returnTwine(request.session.userData, response, TWINE_PATH);
}
```

#### 5. Logout Endpoint (`loginDiscord/index.js:175-184`)

Added `/logout` route to clear sessions:

```javascript
app.get('/logout', (request, response) => {
    request.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        response.clearCookie('connect.sid');
        response.redirect('/');
    });
});
```

#### 6. Removed sessionStorage.clear() (`sharedRoutes.js:100`)

Changed from:

```javascript
sessionStorage.clear();
let userData=${JSON.stringify(userData)}
```

To:

```javascript
// Session is now managed by server-side cookies, no need to clear
let userData=${JSON.stringify(userData)}
```

## User Experience Improvements

### Before

1. User logs in with Discord
2. User plays the game
3. **User refreshes page**
4. **User has to log in again** ❌

### After

1. User logs in with Discord
2. Session cookie is stored (valid for 7 days)
3. **User refreshes page**
4. **User stays logged in** ✅
5. Session persists until:
   - Cookie expires (7 days)
   - User explicitly logs out via `/logout`
   - Server restarts (session cleared)

## Security Features

### Cookie Security

- `httpOnly: true` - Prevents JavaScript access (XSS protection)
- `secure: true` (in production) - HTTPS-only transmission
- `maxAge: 7 days` - Automatic expiration

### Session Secret

- Uses `SESSION_SECRET` environment variable in production
- Random fallback for development
- **IMPORTANT**: Set `SESSION_SECRET` in production environment

### CSRF Protection

The existing OAuth `state` parameter provides CSRF protection during login flow.

## Configuration

### Environment Variables

Add to production environment:

```bash
SESSION_SECRET=your-secure-random-string-here-min-32-chars
NODE_ENV=production
```

Generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Session Persistence Limitations

### Current Implementation

Sessions are stored **in memory** by default with `express-session`. This means:

- ✅ Sessions persist across page refreshes
- ✅ Sessions work for individual users
- ❌ Sessions are lost on server restart
- ❌ Sessions don't scale across multiple server instances

### For Production (Future Enhancement)

Consider using a session store for better persistence:

**Option 1: Redis Store** (Recommended for Heroku)

```bash
npm install connect-redis redis
```

```javascript
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL
});
redisClient.connect().catch(console.error);

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));
```

**Option 2: MongoDB Store**

```bash
npm install connect-mongo
```

```javascript
import MongoStore from 'connect-mongo';

app.use(session({
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));
```

**Option 3: File Store** (Simple, not recommended for production)

```bash
npm install session-file-store
```

## Testing

### Test Session Persistence

1. Start server: `npm start`
2. Navigate to `http://localhost:PORT`
3. Log in with Discord
4. Refresh the page
5. **Expected**: Still logged in, no redirect to Discord

### Test Logout

1. While logged in, navigate to `http://localhost:PORT/logout`
2. **Expected**: Redirected to login page
3. Refresh page
4. **Expected**: Still on login page (session cleared)

### Test Session Expiry

1. Log in
2. Wait 7 days (or modify `maxAge` for testing)
3. Refresh page
4. **Expected**: Redirected to login (session expired)

## Troubleshooting

### Sessions Not Persisting

**Check**:

1. Cookies are enabled in browser
2. `cookie.secure` is `false` in development (unless using HTTPS)
3. No browser extensions blocking cookies

### "Session Secret Required" Warning

**Fix**: Set `SESSION_SECRET` environment variable

```bash
export SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### Sessions Lost on Server Restart

**Expected behavior** with in-memory store. Use Redis/MongoDB store for production.

## Migration Notes

### Breaking Changes

None. This is backward compatible. Users will need to log in once more after deployment, then sessions will persist.

### Rollback

If issues occur, revert these commits and users will return to the old behavior (re-login on refresh).

## Future Enhancements

1. **Implement Redis store** for production scalability
2. **Add "Remember Me" checkbox** for optional extended sessions
3. **Add session activity tracking** (last active time)
4. **Implement token refresh** using Discord refresh tokens
5. **Add session limit** (max sessions per user)

## Files Modified

- `loginDiscord/index.js` - Session middleware, storage, and logout
- `sharedRoutes.js` - Removed sessionStorage.clear()
- `package.json` - Added express-session, cookie-parser dependencies

## References

- [express-session documentation](https://github.com/expressjs/session)
- [Discord OAuth2 documentation](https://discord.com/developers/docs/topics/oauth2)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
