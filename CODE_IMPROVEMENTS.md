# Code Quality Improvements Report

**Generated:** 2025-11-13
**Scope:** Non-twee JavaScript and server code (excluding /unity)
**Total Issues Found:** 50+ across 10 files

---

## Executive Summary

The codebase has several **critical security vulnerabilities** and code quality issues that need immediate attention. The most severe issues include:

- Unauthenticated state modification endpoint
- Weak session secret generation
- Potential prototype pollution vulnerability
- Route handler created inside socket event (memory leak)
- Missing input validation throughout

**Recommended Action:** Address all CRITICAL issues before production deployment.

---

## Priority 1: CRITICAL Issues (Immediate Action Required)

### 1.1 Unauthenticated State Modification (sharedRoutes.js:18-53)

**Severity:** CRITICAL 🔴
**Risk:** Any client can modify server state without authentication

**Current Code:**

```javascript
app.post('/action', urlencodedParser, (req, res) => {
    const { variable, value } = req.body;
    const path = variable.substring(1);
    // No authentication check!

    let parsedValue;
    try {
        parsedValue = JSON.parse(value);
    } catch (e) {
        parsedValue = value;
    }

    webstackInstance.serverStore.setState(diff);
    webstackInstance.io.emit('difference', diff);
});
```

**Recommended Fix:**

```javascript
// Add session authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userData) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

app.post('/action', requireAuth, urlencodedParser, (req, res) => {
    const { variable, value } = req.body;

    // Validate variable path
    if (!isValidStatePath(variable)) {
        return res.status(400).json({ error: 'Invalid variable path' });
    }

    // Rest of implementation...
});

function isValidStatePath(path) {
    // Prevent access to internal properties
    const blacklist = ['__proto__', 'constructor', 'prototype'];
    return !blacklist.some(term => path.includes(term));
}
```

**Effort:** Medium (2-3 hours)
**Impact:** Critical security fix

---

### 1.2 Prototype Pollution Vulnerability (sharedRoutes.js:42-43)

**Severity:** CRITICAL 🔴
**Risk:** Attackers can modify Object prototype, affecting entire application

**Current Code:**

```javascript
const diff = {};
_.set(diff, path, parsedValue);  // User-controlled path
```

**Attack Example:**

```javascript
// Attacker sends:
variable: "$__proto__.isAdmin"
value: "true"

// Now ALL objects have isAdmin: true
```

**Recommended Fix:**

```javascript
// Install: npm install lodash.setwith
import setWith from 'lodash.setwith';

function safePath(path) {
    const dangerous = ['__proto__', 'constructor', 'prototype'];
    const parts = path.split(/[.\[\]]/);
    return !parts.some(p => dangerous.includes(p));
}

// In handler:
if (!safePath(path)) {
    return res.status(400).json({ error: 'Invalid path' });
}

const diff = {};
setWith(diff, path, parsedValue, Object);  // Object prevents prototype pollution
```

**Effort:** Low (1 hour)
**Impact:** Critical security fix

---

### 1.3 Weak Session Secret (loginDiscord/index.js:88)

**Severity:** CRITICAL 🔴
**Risk:** Session hijacking, predictable session IDs

**Current Code:**

```javascript
secret: process.env.SESSION_SECRET || 'aztec-game-secret-' + Math.random().toString(36),
```

**Problem:** `Math.random()` is NOT cryptographically secure

**Recommended Fix:**

```javascript
import crypto from 'crypto';

// At top of file, before session middleware
const getSessionSecret = () => {
    if (process.env.SESSION_SECRET) {
        return process.env.SESSION_SECRET;
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('SESSION_SECRET environment variable must be set in production');
    }

    // Development only: generate secure random secret
    const secret = crypto.randomBytes(32).toString('hex');
    console.warn('⚠️  Using auto-generated session secret in development');
    console.warn('⚠️  Set SESSION_SECRET env var for production');
    return secret;
};

// In session config:
app.use(session({
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));
```

**Effort:** Low (30 minutes)
**Impact:** Critical security fix

---

### 1.4 Route Handler Memory Leak (Webstack.js:131-133)

**Severity:** CRITICAL 🔴
**Risk:** Each fullReset creates duplicate routes, memory leak, server crash

**Current Code:**

```javascript
socket.on('fullReset', ()=>{
    this.serverStore.replaceState(Object.assign({}, initVars));
    app.post('/updateGit',(req, res) => {  // ❌ Created EVERY fullReset!
        res.send({})
    })
    socket.emit('reset',{})
    socket.broadcast.emit('reset', {})
})
```

**Recommended Fix:**

```javascript
// Remove route registration from socket event entirely
socket.on('fullReset', ()=>{
    this.serverStore.replaceState(Object.assign({}, initVars));
    socket.emit('reset',{})
    socket.broadcast.emit('reset', {})
})

// If /updateGit route is needed, register it ONCE during initialization
// It's already registered in sharedRoutes.js, so this entire block can be removed
```

**Effort:** Low (15 minutes)
**Impact:** Prevents memory leak and server instability

---

### 1.5 Wrong Window Capitalization (Client.js:20-23)

**Severity:** CRITICAL 🔴
**Risk:** Runtime error breaking multiplayer functionality

**Current Code:**

```javascript
let users = Window.SugarCubeState.getVar("$users")  // ❌ Wrong case
var userId = Window.SugarCubeState.getVar("$role");
var user = Window.SugarCubeState.getVar("$users")[userId];
```

**Recommended Fix:**

```javascript
let users = window.SugarCubeState.getVar("$users")  // ✓ Correct
var userId = window.SugarCubeState.getVar("$role");
var user = window.SugarCubeState.getVar("$users")[userId];
```

**Effort:** Low (5 minutes)
**Impact:** Fixes runtime error

---

### 1.6 Broken setTimeout Call (Client.js:292)

**Severity:** HIGH 🟠
**Risk:** Function doesn't work as intended

**Current Code:**

```javascript
function DOMTest() {
    setTimeout({})  // ❌ Invalid - expects function, not object
    return $("#passages").children()[0].innerHTML
}
```

**Recommended Fix:**

```javascript
// Option 1: Fix the function
function DOMTest() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve($("#passages").children()[0].innerHTML);
        }, 0);
    });
}

// Option 2: If unused, remove it
// (appears unused based on codebase analysis)
```

**Effort:** Low (10 minutes)
**Impact:** Fixes broken functionality

---

## Priority 2: HIGH Issues (Address Soon)

### 2.1 No Socket Event Validation (Webstack.js:120-126)

**Severity:** HIGH 🟠
**Risk:** State corruption from malicious clients

**Current Code:**

```javascript
socket.on('difference', (diff) => {
    this.serverStore.setState(diff);  // No validation!
    if(!Object.keys(diff).includes("theyrPrivateVars")){
        socket.broadcast.emit('difference', diff)
    }
})
```

**Recommended Fix:**

```javascript
// Define allowed state paths
const ALLOWED_STATE_PATHS = [
    'users',
    'chatlog',
    'Aztec_Leader',
    'Spanish_Leader',
    // ... other valid paths
];

socket.on('difference', (diff) => {
    // Validate diff structure
    if (typeof diff !== 'object' || diff === null) {
        console.warn('Invalid diff received:', diff);
        return;
    }

    // Validate all paths in diff
    const diffKeys = Object.keys(diff);
    const invalidKeys = diffKeys.filter(key =>
        !ALLOWED_STATE_PATHS.some(allowed => key.startsWith(allowed))
    );

    if (invalidKeys.length > 0) {
        console.warn('Blocked invalid state paths:', invalidKeys);
        return;
    }

    // Proceed with validated diff
    this.serverStore.setState(diff);
    if(!diffKeys.includes("theyrPrivateVars")){
        socket.broadcast.emit('difference', diff)
    }
})
```

**Effort:** Medium (2 hours)
**Impact:** Prevents state corruption

---

### 2.2 Missing Await on Async Operation (sharedRoutes.js:58)

**Severity:** HIGH 🟠
**Risk:** Unhandled promise rejections, no error feedback to client

**Current Code:**

```javascript
app.post('/updateGit', async ({ query }, res) => {
    res.send({});
    webstackInstance.updateGit(false);  // ❌ No await!
});
```

**Recommended Fix:**

```javascript
app.post('/updateGit', async (req, res) => {
    try {
        await webstackInstance.updateGit(false);
        res.json({ status: 'success' });
    } catch (err) {
        console.error('Git update failed:', err.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update Git repository'
        });
    }
});
```

**Effort:** Low (15 minutes)
**Impact:** Proper error handling

---

### 2.3 RefreshTokens Memory Leak (loginDiscord/index.js:81)

**Severity:** HIGH 🟠
**Risk:** Tokens leak across user sessions, memory grows unbounded

**Current Code:**

```javascript
let refreshTokens = {};  // ❌ Module-level variable shared across requests
```

**Recommended Fix:**

```javascript
// Store refresh tokens in user session instead
// In OAuth handler:
if (oauthData.refresh_token) {
    request.session.refreshToken = oauthData.refresh_token;
}

// When using refresh token:
if (request.session.refreshToken) {
    payload = {
        ...payload,
        grant_type: 'refresh_token',
        refresh_token: request.session.refreshToken
    }
    delete payload.code;
}
```

**Effort:** Medium (1 hour)
**Impact:** Prevents memory leak, improves security

---

### 2.4 Callback Hell Anti-Pattern (gitApiIO.js:50-82)

**Severity:** MEDIUM 🟡 (but affects code quality significantly)
**Risk:** Hard to maintain, error-prone

**Current Code:**

```javascript
return new Promise((res, rej) => {
    axios(configGetFile)
        .then(function (response) {
            // ...
            axios(configPutFile)
                .then(function (response) {
                    res()
                })
                .catch(function (error) {
                    rej(error)
                });
            })
        .catch(function (error) {
            rej(error)
        });
})
```

**Recommended Fix:**

```javascript
async uploadFileApi(content, isTest = this.test) {
    if (isTest) {
        fs.writeFileSync(testFile, base64.decode(content));
        return;
    }

    try {
        // Get current file SHA
        const getResponse = await axios(configGetFile);
        const sha = getResponse.data.sha;

        // Prepare update
        const data = JSON.stringify({
            "message": `Auto-save game state - ${new Date().toISOString()}`,
            "content": content,
            "sha": sha,
        });

        const configPutFile = {
            method: 'put',
            url: this.fileURL,
            headers: {
                'Authorization': `token ${this.token}`,
                'Content-Type': 'application/json'
            },
            data: data
        };

        // Update file
        await axios(configPutFile);
    } catch (error) {
        console.error('Git API error:', error.message);
        throw error;
    }
}
```

**Effort:** Medium (1 hour)
**Impact:** Much more readable and maintainable

---

### 2.5 Race Condition in Socket Initialization (Client.js:365-374)

**Severity:** HIGH 🟠
**Risk:** Game loads before state is synced

**Current Code:**

```javascript
socket.on('connect', () => {
    socket.emit('new user', socket.id);
    lockInfo.callback(lockInfo.lockId)  // ❌ Called before 'new connection'
})

socket.on('new connection', (state) => {
    // State loaded here, but game already started
    let combinedState = Object.assign({}, window.SugarCubeState.variables, state)
    $(document).trigger(":liveupdate");
});
```

**Recommended Fix:**

```javascript
socket.on('connect', () => {
    socket.emit('new user', socket.id);
    // Don't unlock yet
})

socket.on('new connection', (state) => {
    let combinedState = Object.assign({}, window.SugarCubeState.variables, state)
    updateSugarCubeState(combinedState);
    $(document).trigger(":liveupdate");

    // NOW unlock the game after state is loaded
    lockInfo.callback(lockInfo.lockId);
});
```

**Effort:** Low (30 minutes)
**Impact:** Prevents loading with incorrect state

---

## Priority 3: MEDIUM Issues (Plan to Address)

### 3.1 Synchronous File Operations

**Files Affected:**
- `sharedRoutes.js:104` - `fs.readFileSync(twinePath)`
- `login/index.js:52` - `fs.readFileSync(htmlTemplate)`
- `loginDiscord/index.js:196` - `fs.readFileSync(htmlTemplate)`

**Problem:** Blocking I/O reduces server throughput

**Recommended Fix:**

```javascript
// Option 1: Use async file reading
const fileContents = await fs.promises.readFile(twinePath, 'utf8');

// Option 2: Cache file contents at startup
let twineFileCache = null;
async function loadTwineFile() {
    if (!twineFileCache) {
        twineFileCache = await fs.promises.readFile(TWINE_PATH, 'utf8');
    }
    return twineFileCache;
}
```

**Effort:** Medium (2 hours across all files)
**Impact:** Improved server performance

---

### 3.2 Mixing ES6 and CommonJS Modules

**Files Affected:** All server files

**Current Pattern:**

```javascript
import express from 'express';
const require = createRequire(import.meta.url);
const bodyParser = require('body-parser');
```

**Recommended Fix:** Choose one module system and stick to it

```javascript
// Option 1: Pure ES6 (Recommended)
import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';

// Option 2: Pure CommonJS
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
```

**Effort:** High (4-6 hours)
**Impact:** Cleaner, more maintainable codebase

---

### 3.3 Missing Input Validation

**Files Affected:**
- `loginDiscord/index.js` - OAuth parameters
- `login/index.js:33-34` - nick and id parameters
- `sharedRoutes.js` - action endpoint

**Recommended Fix:** Use validation library

```bash
npm install joi
```

```javascript
import Joi from 'joi';

// Define schemas
const actionSchema = Joi.object({
    variable: Joi.string().pattern(/^\$[a-zA-Z0-9_\[\]\.]+$/).required(),
    value: Joi.string().required()
});

// In route handler:
app.post('/action', requireAuth, urlencodedParser, (req, res) => {
    const { error, value } = actionSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    // Use validated value
    const { variable, value: rawValue } = value;
    // ...
});
```

**Effort:** Medium (3-4 hours)
**Impact:** Prevents injection attacks, improves reliability

---

### 3.4 Global Variable Pollution

**Files Affected:**
- `Client.js` - socket, exceptions, stateReceived, etc.
- `resize.js` - stageWidth, stageHeight, etc.
- `picker.js` - jsLoaded

**Recommended Fix:** Wrap in IIFE or use modules

```javascript
// Before:
var socket;
var exceptions = [];

// After:
(function() {
    'use strict';

    let socket;
    let exceptions = [];

    // All code here...

    // Export only what's needed
    window.AztecGame = {
        initTheyr,
        showStats,
        // other public functions
    };
})();
```

**Effort:** Medium (2-3 hours)
**Impact:** Cleaner global scope, fewer conflicts

---

### 3.5 Poor Error Handling

**Pattern Found:** Many empty catch blocks and silent failures

**Example:**

```javascript
// Bad:
} catch (error) {
    // Empty or comment only
}

// Good:
} catch (error) {
    console.error('Operation failed:', error.message);
    // Optionally notify user or retry
}
```

**Effort:** Low-Medium (2-3 hours to audit all error handling)
**Impact:** Better debugging and user experience

---

## Priority 4: LOW Issues (Nice to Have)

### 4.1 Magic Numbers and Strings

**Examples:**
- `tweeGaze.js:37` - 1000ms cooldown
- `Client.js:91-92` - Cookie maxAge
- `resize.js:6-7` - 16:9 aspect ratio

**Recommended Fix:**

```javascript
// Define constants at top of file
const REBUILD_COOLDOWN_MS = 1000;
const ASPECT_RATIO_WIDTH = 16;
const ASPECT_RATIO_HEIGHT = 9;
const SESSION_MAX_AGE_DAYS = 7;
```

---

### 4.2 Commented-Out Code

**Files:** Client.js, tweeGaze.js, picker.js, discordBot.js

**Recommended Fix:** Remove commented code or move to documentation

---

### 4.3 Inconsistent Code Style

**Issues:**
- Mix of `function` and arrow functions
- Inconsistent indentation
- Mix of single/double quotes

**Recommended Fix:** Set up ESLint

```bash
npm install --save-dev eslint eslint-config-airbnb-base
```

```javascript
// .eslintrc.json
{
    "extends": "airbnb-base",
    "env": {
        "browser": true,
        "node": true,
        "es6": true
    },
    "rules": {
        "indent": ["error", "tab"],
        "no-console": "off",
        "prefer-arrow-callback": "warn"
    }
}
```

---

## Implementation Roadmap

### Phase 1: Critical Security Fixes (1-2 days)

1. ✅ Add authentication middleware to `/action` endpoint
2. ✅ Fix prototype pollution vulnerability
3. ✅ Use crypto.randomBytes for session secret
4. ✅ Remove route creation from socket event
5. ✅ Fix Window capitalization
6. ✅ Fix broken setTimeout call

### Phase 2: High Priority Fixes (2-3 days)

1. ✅ Add socket event validation
2. ✅ Fix missing await on updateGit
3. ✅ Move refreshTokens to session storage
4. ✅ Refactor callback hell to async/await
5. ✅ Fix race condition in socket initialization

### Phase 3: Medium Priority Improvements (1 week)

1. ✅ Convert synchronous file operations to async
2. ✅ Standardize module system (ES6 vs CommonJS)
3. ✅ Add comprehensive input validation
4. ✅ Wrap client scripts to avoid global pollution
5. ✅ Improve error handling throughout

### Phase 4: Low Priority Polish (Ongoing)

1. ✅ Replace magic numbers with named constants
2. ✅ Remove commented-out code
3. ✅ Set up ESLint for code consistency
4. ✅ Add JSDoc comments to functions
5. ✅ Write unit tests for critical paths

---

## Testing Recommendations

After implementing fixes:

1. **Security Testing:**
   - Test authentication on /action endpoint
   - Attempt prototype pollution attack
   - Verify session security

2. **Functionality Testing:**
   - Test OAuth flow with session persistence
   - Test multiplayer state synchronization
   - Test chat functionality
   - Test file upload to Git

3. **Performance Testing:**
   - Load test with multiple concurrent users
   - Monitor memory usage over time
   - Check for memory leaks

4. **Error Handling Testing:**
   - Test network failures
   - Test invalid inputs
   - Test edge cases

---

## Tools and Dependencies to Add

```bash
# Security
npm install helmet              # Security headers
npm install express-rate-limit  # Rate limiting
npm install express-validator   # Input validation

# Development
npm install --save-dev eslint eslint-config-airbnb-base
npm install --save-dev jest     # Testing framework

# Optional: Better session storage
npm install connect-redis redis  # For production scalability
```

---

## Monitoring Recommendations

1. **Error Tracking:** Implement Sentry or similar
2. **Logging:** Use Winston or Pino for structured logging
3. **Performance:** Add NewRelic or DataDog APM
4. **Uptime:** Configure uptime monitoring

---

## Conclusion

The codebase has significant security vulnerabilities that should be addressed immediately before production deployment. The good news is that most critical issues have straightforward fixes.

**Estimated Total Effort:**
- Phase 1 (Critical): 1-2 days
- Phase 2 (High): 2-3 days
- Phase 3 (Medium): 1 week
- Phase 4 (Low): Ongoing

**Total for Critical + High Priority:** ~1 week of focused development

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Lodash Security](https://snyk.io/advisor/npm-package/lodash/functions/lodash.set)
