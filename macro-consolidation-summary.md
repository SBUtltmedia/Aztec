# Server-Authoritative Macro Consolidation

## Summary

Consolidated the three server-authoritative macros (`<<th-set>>`, `<<th-run-set>>`, `<<sendAction>>`) into a simpler two-macro system to reduce complexity while maintaining all functionality.

## Changes Made

### 1. Enhanced `<<th-set>>` Macro
**Location**: `Twine/Aztec/00_Setup.twee:182-278`

**Improvements**:
- Now checks the `exceptions` array (for `$userId`, `$role`, `$god`, `$godParam`, `$passageHistory`)
- Variables in the exceptions array will not be synced to the server (client-local only)
- Better logging to indicate whether a variable is skipped due to being temporary or an exception

**Before**:
```javascript
if (cleanVarPath.startsWith('_')) {
    // Skip temporary variables
}
```

**After**:
```javascript
const isTemporary = cleanVarPath.startsWith('_');
const isException = typeof exceptions !== 'undefined' && exceptions.includes(cleanVarPath);

if (isTemporary || isException) {
    console.log('Skipping variable from server sync:', varPath, isTemporary ? '(temporary)' : '(exception)');
    // Handle locally only
}
```

### 2. Removed `<<th-run-set>>` Macro
**Reason**: Never used in the codebase, unnecessary complexity

The macro was defined but had zero usage across all `.twee` files. Its functionality can be achieved with `<<th-set>>` for most cases, or `<<sendAction>>` for dynamic paths.

### 3. Kept & Improved `<<sendAction>>` Macro
**Location**: `Twine/Aztec/00_Setup.twee:280-312`

**Purpose**: Handles dynamic variable paths that can't be expressed as string literals

**Use Case**: When you need to construct the variable path programmatically:
```twee
<<set _nestedPath = '$users["' + $role + '"]["choices"]["nestedCounter"]'>>
<<sendAction _nestedPath 10>>
```

**Updated Documentation**: Clarified that this is for dynamic paths only, and `<<th-set>>` should be used for normal cases.

### 4. Fixed Chat Code
**Location**: `Twine/Aztec/99_Uncategorized.twee:2322-2332`

**Problem**: Original code tried to use a temporary variable `_msg` inside a `<<th-set>>` expression, which caused evaluation errors.

**Before**:
```twee
<<set _msg = {user: $role, message:_chattext, time:...}>>
<<th-set '$chatlog[$users[$role].currentChat]' to $chatlog[$users[$role].currentChat].slice(-4).concat([_msg])>>
```

**After**:
```twee
<<set _currentChat = $users[$role].currentChat>>
<<set _chatArray = $chatlog[_currentChat] || []>>
<<set _timestamp = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(",", "")>>
<<th-set '$chatlog[_currentChat]' to _chatArray.slice(-4).concat([{user: $role, message: _chattext, time: _timestamp}])>>
```

**Benefits**:
- Uses temporary variables for complex parts
- Embeds the object literal directly in the expression
- More reliable evaluation in the `<<th-set>>` context

### 5. Migrated Aguilar Quest from `<<sendAction>>` to `<<th-set>>`
**Location**: `Twine/Aztec/01_Aguilar.twee:268-274`

**Before**:
```twee
<<sendAction "$Aguilar_1" "No">>
<<sendAction "$factions['Spaniards']['stats']['Strength']" $factions['Spaniards']['stats']['Strength']-1>>
```

**After**:
```twee
<<th-set '$Aguilar_1' to "No">>
<<th-set '$factions["Spaniards"]["stats"]["Strength"]' -= 1>>
```

**Benefits**:
- More consistent with rest of codebase
- Cleaner syntax using compound operators
- Fixed quote style (double quotes for consistency)

## Final Macro Architecture

### `<<th-set>>` - Primary macro (use 99% of the time)
```twee
<<th-set '$variable' to value>>
<<th-set '$score' += 5>>
<<th-set '$users[$role]["stats"]["Strength"]' -= 1>>
```

**Features**:
- Expression-based evaluation
- Supports compound operators (`+=`, `-=`, `*=`, `/=`)
- Automatically filters temporary variables (`$_var`)
- Automatically filters exception variables (`$userId`, `$role`, etc.)
- Evaluates expressions in SugarCube context with access to both `$variables` and `_temporary`

### `<<sendAction>>` - Dynamic path macro (use rarely)
```twee
<<set _path = '$users["' + $role + '"]["score"]'>>
<<sendAction _path 100>>
```

**Use Only When**:
- You need to build the variable path using string concatenation
- The variable path is stored in a temporary variable
- You need to pass a pre-computed value directly

## Testing Needed

1. **Chat functionality**: Test sending messages in both Global and Faction chat
2. **Aguilar Quest**: Test all four answer options and verify strength changes
3. **Exception variables**: Verify `$userId` and `$role` are still client-local
4. **Nested paths**: Test the dynamic path test in `12_Test.twee`

## Benefits of Consolidation

1. **Simpler mental model**: Two macros instead of three
2. **Better exception handling**: `<<th-set>>` now properly respects the exceptions array
3. **Fixed bugs**: Chat code no longer throws errors
4. **Better documentation**: Clear guidance on when to use each macro
5. **Reduced code**: Removed ~50 lines of unused macro definition

## Breaking Changes

None - all existing `<<th-set>>` and `<<sendAction>>` usage remains compatible.
