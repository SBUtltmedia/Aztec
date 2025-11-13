# Aztec Codebase Cleanup Report

**Generated:** 2025-11-13
**Analyzed:** All files except `/unity` directory
**Total Issues Found:** 200+ items across 9 categories

---

## Executive Summary

This report identifies cleanup opportunities in the Aztec multiplayer Twine project. Issues are categorized by priority and effort level to help plan cleanup activities.

**Key Findings:**

- 15 backup `.twee` files ready for deletion
- 150+ debug console.log statements
- 80+ files with commented-out code
- Several legacy/test files that can be removed
- Security issue: disabled CORS check

---

## 1. Backup Files to Delete

### High Priority - Low Effort

**15 `.backup` files in Twine/Aztec/**

These files appear to be backups of the current twee files and can be safely deleted after verification:

```
Twine/Aztec/01_Aguilar.twee.backup
Twine/Aztec/02_Cortes.twee.backup
Twine/Aztec/03_Moctezuma.twee.backup
Twine/Aztec/04_Aztec.twee.backup
Twine/Aztec/05_Spanish.twee.backup
Twine/Aztec/06_Tlaxcalan.twee.backup
Twine/Aztec/07_Marina.twee.backup
Twine/Aztec/08_Acts.twee.backup
Twine/Aztec/09_Library.twee.backup
Twine/Aztec/10_Control.twee.backup
Twine/Aztec/12_Test.twee.backup
Twine/Aztec/13_Cholula.twee.backup
Twine/Aztec/15_Veracruz.twee.backup
Twine/Aztec/16_Riot.twee.backup
Twine/Aztec/99_Uncategorized.twee.backup
```

**Additional backup files:**

```
Twine/Aztec.twee.bak
```

**Action:**

```bash
# After verification, delete with:
rm Twine/Aztec/*.backup
rm Twine/Aztec.twee.bak
```

**Priority:** HIGH
**Effort:** Low (5 minutes)
**Benefit:** Reduces clutter, prevents confusion

---

## 2. Dead Code and Debug Statements

### Console.log Statements (150+ instances)

Debug console.log statements should be removed from production code or replaced with a proper logging framework.

#### gitApiIO.js (13 instances)

```javascript
Lines: (26, 27, 36, 39, 58, 77, 82, 88, 100, 131, 134, 157, 162);
```

#### static/Client.js (25+ instances)

```javascript
Lines: (16,
  24,
  30,
  39,
  97,
  275,
  278,
  280 - 283,
  290,
  296,
  369,
  383,
  389 - 390,
  400,
  407,
  426,
  434);
```

**Example:**

```javascript
// Line 16
console.log(event);

// Line 24
console.log(users);

// Line 97
console.log(difference);
```

#### Webstack.js (12 instances)

```javascript
Lines: (36, 39, 41, 47, 79, 87, 91, 94, 102, 108, 115, 142);
```

**Example:**

```javascript
// Line 102
console.log("is Test:", this.isTest);

// Line 115
console.log("SERVER RECEIVES NEW USER:", id);
```

#### loginDiscord/index.js (6 instances)

```javascript
Lines: (63, 65, 70, 115, 122, 149);
```

#### Twine Files

- `99_Uncategorized.twee`: Lines 2136, 2254, 2259, 2279, 2283, 2285, 2957, 3188, 3193
- `00_Setup.twee`: Lines 214, 242, 290

**Recommendation:**

1. Remove debug console.logs
2. Keep only critical error logging
3. Consider using a logging library (winston, bunyan, pino)

**Priority:** HIGH
**Effort:** Medium (3-4 hours to review and remove selectively)
**Benefit:** Cleaner production logs, better performance

---

### Commented-Out Code Blocks

**80+ files** contain multi-line commented code. Here are the most significant:

#### static/Client.js

**Lines 11-12:** Security check (CRITICAL)

```javascript
// if (event.origin !== 'http://your-iframe-origin.com') return;
```

**Action:** UNCOMMENT and configure properly for security

**Lines 25-27:** Dead iteration code

```javascript
// Object.keys(users).array.forEach(element => {
//     console.log(element)
// });
```

**Action:** DELETE

**Lines 223, 228:** Debug logs

```javascript
//console.log({value, rawValue});
// console.log(maskStyle)
```

**Action:** DELETE

#### regex.py

Almost the entire file is commented out. Purpose unclear.

**Lines 1-50+:** Multiple commented functions

```python
# def convert_th_set_to_set(content):
#     pattern = r'<<th-set\s+(["\']?)(\$[^"\'>\s]+)\1\s+to\s+(.+?)>>'
#     ...
```

**Action:** DELETE file if no longer needed, or document purpose

#### Webstack.js

Multiple commented sections related to old Redux implementation and database code.

**Action:** Review and remove deprecated code

**Priority:** HIGH
**Effort:** Medium (4-6 hours to review each block)
**Benefit:** Improved code readability and maintainability

---

### TODO/FIXME Comments

#### static/Client.js:245

```javascript
//TODO: try to only send stats of user
```

**Action:** Either implement optimization or remove comment if not needed

**Priority:** MEDIUM
**Effort:** Medium (requires reviewing data flow)

---

## 3. Legacy and Test Files

### High Priority - Can Likely Be Deleted

#### Legacy PHP Files

```
Twine/images/tmp.php              # Temporary file copying script
Twine/images/PHP_errors.log       # Old error log from 2021
```

**Action:** Delete both files
**Priority:** HIGH
**Effort:** Low (verify not used, then delete)

#### Old Format File

```
storyformats/sugarcube-2/format_old.js    # 478KB old version
```

**Action:** Verify `format.js` works, then delete
**Priority:** HIGH
**Effort:** Low

---

### Medium Priority - Review Purpose

#### Python Conversion Scripts

These scripts may have been used for the th-set conversion:

```
convert_to_thset.py
fix_local_var_thset.py
fix_redundant_equals.py
split_twee.py
regex.py
```

**Action:**

- If conversion is complete, archive or delete
- If needed for future conversions, move to `/scripts` directory and document

**Priority:** MEDIUM
**Effort:** Low (5 minutes per file)

#### Test Files

```
Twine/test.twee
regex_output.twee
static/test.js
test.json
loginDiscord/testVars.json        # Modified per git status
```

**Action:**

- Delete or move to `/tests` directory
- Add `testVars.json` to .gitignore if it's generated

**Priority:** MEDIUM
**Effort:** Low

#### Demo Files

```
Twine/demo_style.css
```

**Action:** Delete if unused
**Priority:** LOW
**Effort:** Low

---

## 4. Configuration Issues

### .gitignore Improvements

**Current Issues:**

- Backup files are not ignored
- Test files are being tracked
- Build artifacts may not be ignored

**Recommended additions to .gitignore:**

```gitignore
# Backup files
*.backup
*.bak
*.old
*.tmp

# Test files
**/testVars.json
test.json
regex_output.twee

# Logs
*.log

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

**Priority:** HIGH
**Effort:** Low (2 minutes)

---

### loginDiscord/testVars.json

**Issue:** File is modified and tracked in git (per git status)

**Action:** Add to .gitignore if it contains generated test data

**Priority:** MEDIUM
**Effort:** Low

---

## 5. Code Organization Issues

### Variable Declaration Style

**Issue:** Mix of `var`, `let`, and `const` throughout codebase

- Found 729 instances of `var` declarations

**Example locations:**

- Client.js
- Webstack.js
- gitApiIO.js
- All twee files with `<<script>>` blocks

**Recommendation:** Standardize to ES6 `const`/`let` style

**Priority:** LOW
**Effort:** High (but can be automated with ESLint auto-fix)

---

### File Structure Organization

**Issue:** Scattered twee files in multiple locations

**Current structure:**

```
Twine/Aztec/          # Modular twee files (organized)
Twine/Aztec.twee.bak  # Old backup
regex_output.twee     # Output file in root
Twine/test.twee       # Test file
```

**Recommendation:**

- Keep only `Twine/Aztec/` for twee source files
- Move test files to dedicated test directory
- Delete output files

**Priority:** MEDIUM
**Effort:** Medium (1-2 hours)

---

## 6. Documentation Issues

### Empty/Minimal Documentation

#### structure.md

```markdown
This is a sugarcube twine project which is meant to allow for multiplayer games
```

**Action:** Either populate with project structure documentation or delete

**Priority:** LOW
**Effort:** Low to Medium (depending on scope)

---

### Markdown Linting Issues

#### console.md (80+ warnings)

- Hard tabs instead of spaces
- Inline HTML without blank lines
- Heading formatting issues

#### CLAUDE.md (40+ warnings)

- Similar formatting issues

**Action:** Run markdown formatter/linter

```bash
# Using markdownlint or prettier
npx prettier --write "*.md"
```

**Priority:** LOW
**Effort:** Low (automated, 5 minutes)

---

### Outdated Comments

#### static/Client.js:11-12

```javascript
// In a real application, replace '*' with the expected origin
```

**Issue:** Generic placeholder comment still in production code

**Action:** Update with actual origin or document why '\*' is acceptable

**Priority:** MEDIUM
**Effort:** Low

---

## 7. CSS Issues

### Twine/style.css (1248 lines)

#### Vendor Prefix Issues (Lines 23-29)

```css
-webkit-transform-origin: 0% 0%;
-webkit-transform: scale(1);
```

**Issue:** Missing standard properties after vendor prefixes

**Fix:**

```css
-webkit-transform-origin: 0% 0%;
transform-origin: 0% 0%;
-webkit-transform: scale(1);
transform: scale(1);
```

**Priority:** MEDIUM
**Effort:** Low (10 minutes)

#### Invalid CSS (Line 455)

```css
display: inline-block; /* Ignored due to float */
```

**Action:** Either remove `float` or remove `display: inline-block`

**Priority:** MEDIUM
**Effort:** Low

#### Empty Ruleset (Line 1237)

```css
.someClass {
  /* empty */
}
```

**Action:** Remove empty rulesets

**Priority:** LOW
**Effort:** Low

---

## 8. Security Issues

### CRITICAL: Disabled CORS Check

**Location:** `static/Client.js:12`

```javascript
// if (event.origin !== 'http://your-iframe-origin.com') return;
```

**Issue:** Security check for cross-origin messages is commented out

**Risk:** Allows messages from any origin

**Action:** UNCOMMENT and configure with proper origin

```javascript
if (event.origin !== window.location.origin) return;
```

**Priority:** CRITICAL
**Effort:** Low (5 minutes)
**Benefit:** Prevents XSS and injection attacks

---

### Dead Code with Undefined Variable

**Location:** `Webstack.js:40`

```javascript
response.write(err.message, 'utf8', () => {
```

**Issue:** `response` is not defined in this scope (inside constructor)

**Action:** Remove this dead code

**Priority:** MEDIUM
**Effort:** Low

---

## 9. Dependencies

### Analysis of package.json

**Good News:** All dependencies appear to be actively used

**Used Dependencies:**

- `express` - Core server (login/index.js, loginDiscord/index.js)
- `socket.io` - Multiplayer (Webstack.js, Client.js)
- `axios` - API calls (gitApiIO.js)
- `lodash` - Utilities (used extensively)
- `base-64`, `js-base64` - Encoding (gitApiIO.js)
- `body-parser` - Request parsing (sharedRoutes.js)
- `extwee` - Twee compilation
- `gaze` - File watching (tweeGaze.js)
- `nodemon` - Development
- `node-fetch`, `xhr2` - HTTP requests

**Recommendation:** No unused dependencies found

**Priority:** N/A

---

## Cleanup Action Plan

### Phase 1: Immediate (High Priority, Low Effort) - 2-3 hours

1. **Enable CORS Security** (CRITICAL)

   ```bash
   # Edit static/Client.js:12
   # Uncomment and configure origin check
   ```

2. **Delete Backup Files**

   ```bash
   rm Twine/Aztec/*.backup
   rm Twine/Aztec.twee.bak
   ```

3. **Delete Legacy Files**

   ```bash
   rm Twine/images/tmp.php
   rm Twine/images/PHP_errors.log
   rm storyformats/sugarcube-2/format_old.js  # After verification
   ```

4. **Update .gitignore**

   ```bash
   # Add backup files, test files, logs
   ```

5. **Remove Dead Code**
   ```bash
   # Remove response.write in Webstack.js:40
   ```

---

### Phase 2: Short Term (High Priority, Medium Effort) - 8-12 hours

1. **Remove Console.log Statements**
   - Review each file systematically
   - Keep only critical error logging
   - Consider adding logging framework

2. **Remove Commented-Out Code**
   - Review 80+ files
   - Delete dead code blocks
   - Document reasons if code must stay commented

3. **Organize Test Files**
   - Create `/tests` directory
   - Move test files
   - Update any references

4. **Fix CSS Issues**
   - Add standard properties after vendor prefixes
   - Remove empty rulesets
   - Fix invalid CSS

---

### Phase 3: Medium Term (Medium Priority) - 8-16 hours

1. **Standardize Variable Declarations**
   - Set up ESLint with `no-var` rule
   - Run auto-fix: `eslint --fix`
   - Manual review of changes

2. **Document Project Structure**
   - Populate structure.md
   - Document file organization
   - Add architecture diagrams

3. **Review Python Scripts**
   - Document purpose of each script
   - Archive if conversion complete
   - Delete if obsolete

4. **Fix Markdown Linting**

   ```bash
   npx prettier --write "*.md"
   ```

5. **Implement TODO Items**
   - Review TODO in Client.js:245
   - Either implement or remove

---

### Phase 4: Long Term (Low Priority or High Effort) - 40+ hours

1. **TypeScript Migration**
   - Convert to TypeScript for type safety
   - Add type definitions
   - Configure tsconfig.json

2. **Logging Framework**
   - Replace console.log with winston/pino
   - Add log levels
   - Configure log rotation

3. **Comprehensive Documentation**
   - Add JSDoc comments
   - Generate API documentation
   - Create developer guide

---

## Estimated Time Summary

| Phase   | Priority | Effort | Time       |
| ------- | -------- | ------ | ---------- |
| Phase 1 | High     | Low    | 2-3 hours  |
| Phase 2 | High     | Medium | 8-12 hours |
| Phase 3 | Medium   | Medium | 8-16 hours |
| Phase 4 | Low      | High   | 40+ hours  |

**Total for High/Medium Priority:** ~20-30 hours

---

## Quick Start Commands

### Immediate Cleanup (30 minutes)

```bash
# 1. Delete backup files
find Twine/Aztec -name "*.backup" -delete
rm Twine/Aztec.twee.bak

# 2. Delete legacy files
rm Twine/images/tmp.php Twine/images/PHP_errors.log

# 3. Update .gitignore
cat >> .gitignore << EOF
# Backup files
*.backup
*.bak
*.old
*.tmp
# Test files
**/testVars.json
test.json
regex_output.twee
# Logs
*.log
EOF

# 4. Git commit cleanup
git add .gitignore
git rm Twine/Aztec/*.backup Twine/Aztec.twee.bak
git commit -m "Clean up backup files and update .gitignore"
```

### Medium Cleanup (2-3 hours)

```bash
# 1. Fix markdown
npx prettier --write "*.md"

# 2. Review and remove test files
git rm Twine/test.twee regex_output.twee static/test.js test.json

# 3. Move testVars.json to .gitignore
echo "loginDiscord/testVars.json" >> .gitignore
git rm --cached loginDiscord/testVars.json
```

---

## Recommendations Priority Matrix

```
High Impact, Low Effort (DO FIRST):
┌─────────────────────────────────────┐
│ • Delete backup files               │
│ • Enable CORS security              │
│ • Update .gitignore                 │
│ • Delete legacy PHP files           │
└─────────────────────────────────────┘

High Impact, Medium Effort (DO SOON):
┌─────────────────────────────────────┐
│ • Remove console.log statements     │
│ • Remove commented code             │
│ • Fix CSS issues                    │
└─────────────────────────────────────┘

Medium Impact, Low Effort (DO WHEN TIME):
┌─────────────────────────────────────┐
│ • Fix markdown linting              │
│ • Organize test files               │
│ • Review Python scripts             │
└─────────────────────────────────────┘

Low Impact, High Effort (FUTURE):
┌─────────────────────────────────────┐
│ • TypeScript migration              │
│ • Logging framework                 │
│ • Comprehensive documentation       │
└─────────────────────────────────────┘
```

---

## Notes

- This report was generated by analyzing the codebase excluding the `/unity` directory
- All file paths are relative to `/Users/pstdenis/Desktop/Aztec/`
- Line numbers are approximate and may shift as files are edited
- Always test after making cleanup changes
- Consider creating a cleanup branch: `git checkout -b cleanup/backup-files`
- Run tests (once implemented) after each cleanup phase

---

**Generated by:** Claude Code
**Date:** 2025-11-13
**Version:** 1.0
