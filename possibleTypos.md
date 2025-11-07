# Possible Typos Found in Twine/Aztec Conversion

## Issue: Redundant Assignment Operator in th-set Macros

### Description
During the conversion from `<<set>>` to `<<th-set>>`, we discovered 151 instances where the original code had a redundant assignment pattern that was carried over. These likely originated from typos in the original code.

### Pattern
The original code had patterns like:
```
<<set $variable = $variable = 1>>
```

This was converted to:
```
<<th-set '$variable' to $variable = 1>>
```

This should be:
```
<<th-set '$variable' to 1>>
```

### Files Affected
- 02_Cortes.twee: Multiple instances
- 03_Moctezuma.twee: Multiple instances
- 04_Aztec.twee: Multiple instances
- 05_Spanish.twee: Multiple instances
- 06_Tlaxcalan.twee: Multiple instances
- 99_Uncategorized.twee: Multiple instances

### Total Count
**349 instances** found and corrected across 6 files:
- 02_Cortes.twee: 60 instances
- 03_Moctezuma.twee: 9 instances
- 04_Aztec.twee: 211 instances
- 05_Spanish.twee: 8 instances
- 06_Tlaxcalan.twee: 9 instances
- 99_Uncategorized.twee: 52 instances

### Example from 04_Aztec.twee:79
**Incorrect:**
```twee
<<link "Tlacaelel" "After the Riot Vote">><<th-set '$users[$role]["choices"]["MocRiot_Tla"]' to $users[$role]["choices"]["MocRiot_Tla"] = 1>><<th-set '$users[$role]["choices"]["Moc_Riot_Vote"]' to $users[$role]["choices"]["Moc_Riot_Vote"] = 1>><</link>>
```

**Should be:**
```twee
<<link "Tlacaelel" "After the Riot Vote">><<th-set '$users[$role]["choices"]["MocRiot_Tla"]' to 1>><<th-set '$users[$role]["choices"]["Moc_Riot_Vote"]' to 1>><</link>>
```

### Semantic Meaning
In most cases, these appear to be simple vote/counter assignments where the intent was to set the value to 1 (or another number), not to perform a redundant self-assignment.

### Fix Strategy
A Python script will be created to automatically fix these patterns by:
1. Detecting `<<th-set '$variable' to $variable = value>>`
2. Replacing with `<<th-set '$variable' to value>>`
3. Preserving all other aspects of the macro call

### Status
- [x] Documented (this file)
- [x] Script created (`fix_redundant_equals.py`)
- [x] Applied to all files successfully

All 349 instances have been corrected. The remaining matches in grep are legitimate uses of compound operators (like `-=`) or documentation strings in the macro definitions.

---

## Issue 2: th-set Macros Using Local Variables

### Description
After the initial conversion, 23 instances were found where `<<th-set>>` was trying to use local variables (temporary variables starting with `_`) in the value expression. This doesn't work because `<<th-set>>` uses `skipArgs: true` for raw argument parsing and cannot evaluate local variables.

### Pattern
Problematic code:
```twee
<<set _currLeader = "Moctezuma">>
<<th-set '$Aztec_Leader' to _currLeader>>  <!-- Won't work! -->
```

### Solution
These were converted to use `<<sendAction>>` instead, which evaluates arguments normally:
```twee
<<set _currLeader = "Moctezuma">>
<<sendAction "$Aztec_Leader" _currLeader>>  <!-- Works! -->
```

### Files Affected
- 04_Aztec.twee: 2 instances
- 10_Control.twee: 9 instances
- 99_Uncategorized.twee: 12 instances

### Total Count
**23 instances** fixed across 3 files.

### Status
- [x] Identified
- [x] Script created (`fix_local_var_thset.py`)
- [x] Applied successfully

All instances have been converted to use `<<sendAction>>` which properly evaluates local variables.

---

## Issue 3: Undefined $role Errors (GOD User)

### Description
Runtime errors occurred when admin users (with `$role = "GOD"`) accessed the game because the code attempted to access `$users[$role]` without checking if the role existed in the users object. The GOD role is for administration and doesn't have a corresponding user entry.

### Errors Encountered
```
Error: Cannot read properties of undefined (reading 'lastSeen')
Error: Cannot read properties of undefined (reading 'role')
Error: Cannot read properties of undefined (reading 'stats')
Error: Cannot read properties of undefined (reading 'currentMap')
Error: Cannot read properties of undefined (reading 'passage')
```

### Solution
Added defensive checks throughout the codebase to verify `$role`, `$users`, and `$users[$role]` exist before accessing their properties.

### Files Modified

#### 99_Uncategorized.twee - PassageDone
Added checks before accessing user data:
```twee
<<if $role && $users && $users[$role]>>
    <!-- User-specific code -->
<</if>>
```

#### 99_Uncategorized.twee - PassageHeader
Protected showMap(), showStats(), and passage tracking with role checks:
```twee
<<if $role && $users && $users[$role]>>
    <<run showStats()>>
    <<run showMap()>>
<</if>>
```

#### static/Client.js - showMap() function
Added early return if user doesn't exist:
```javascript
let roleVar = Window.SugarCubeState.variables.role
let users = Window.SugarCubeState.variables['users']

if (!roleVar || !users || !users[roleVar]) {
    return; // Exit silently if user not found
}
```

#### static/Client.js - showStats() function
Same defensive pattern as showMap().

#### 99_Uncategorized.twee - Background image script
Protected faction access:
```javascript
let role = State.getVar("$role");
let users = State.getVar("$users");

if (role && users && users[role] && users[role]['faction']) {
    imageURL = users[role]['faction'];
}
```

### Total Changes
- **2 files modified**: 99_Uncategorized.twee, static/Client.js
- **6 locations** protected with defensive checks

### Status
- [x] Identified all error locations
- [x] Added defensive checks
- [x] Tested with GOD user

All undefined $role errors have been resolved. The GOD/admin user can now navigate without errors.

---

## Issue 4: Background Images Not Displaying

### Description
Background images were not displaying for any users (including GOD and regular players like Cortes) due to multiple issues in the background script.

### Root Causes

1. **Template literal syntax error**: The `<<script>>` macro in SugarCube couldn't parse ES6 template literals (backticks), causing "Unexpected end of input" errors
2. **Function calls in <<th-set>>**: The macro `<<th-set '$users[$role]["passage"]' to passage()>>` failed because `<<th-set>>` uses `skipArgs: true` and cannot evaluate function calls
3. **GOD user background missing**: No background was specified for admin/GOD users

### Solutions Applied

#### Fixed Template Literal Syntax
Converted all template literals to ES5 string concatenation:
```javascript
// Before (broken):
console.log(`Role: ${role}, imageURL: ${imageURL}`);
$('#story').css({
    'backgroundImage': `url(Twine/images/Borders/${imageURL}.jpg)`
});

// After (working):
console.log("Role: " + role + ", imageURL: " + imageURL);
$('#story').css({
    'backgroundImage': 'url(Twine/images/Borders/' + imageURL + '.jpg)'
});
```

#### Fixed passage() Function Call
Converted from `<<th-set>>` to `<<sendAction>>` with local variable:
```twee
// Before (broken):
<<th-set '$users[$role]["passage"]' to passage()>>

// After (working):
<<set _currentPassage = passage()>>
<<sendAction "$users[$role][\"passage\"]" _currentPassage>>
```

#### Added GOD User Background
GOD/admin users now use the "Control.jpg" background:
```javascript
if (role === "God" || role === "GOD") {
    imageURL = "Control";
}
```

### Background Logic
The final background selection logic:
1. **Home/Control tagged pages** → Home.jpg
2. **GOD/God users on regular pages** → Control.jpg
3. **Regular players** → Faction-specific (Spaniards.jpg, Aztecs.jpg, Tlaxcalans.jpg)
4. **Fallback** → undefined.jpg

### Files Modified
- 99_Uncategorized.twee (PassageHeader background script)
- 99_Uncategorized.twee (passage tracking)

### Status
- [x] Fixed template literal syntax errors
- [x] Fixed passage() function call
- [x] Added GOD user background
- [x] Verified backgrounds display correctly

All background images now display properly for all users!
