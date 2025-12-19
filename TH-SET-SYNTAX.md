# th-set Macro Syntax Analysis

## Current Status: Quotes Are Already Optional!

### Good News

The `<<th-set>>` macro implementation **already supports both quoted and unquoted syntax** thanks to the `skipArgs: true` setting and flexible regex pattern.

### Supported Syntaxes

Both of these should work:

```twee
// Quoted (currently documented style)
<<th-set '$variable' to 10>>
<<th-set '$users[$role].stats' to 5>>
<<th-set '$factions["Aztecs"].Strength' += 2>>

// Unquoted (standard <<set>> syntax)
<<th-set $variable to 10>>
<<th-set $users[$role].stats to 5>>
<<th-set $factions["Aztecs"].Strength += 2>>
```

### How It Works

1. **`skipArgs: true`** (line 181 of 00_Setup.twee)
   - Tells SugarCube NOT to evaluate the arguments
   - Passes the raw text to the macro handler
   - This is the key to supporting unquoted syntax

2. **Flexible regex pattern** (line 198)
   ```javascript
   const assignMatch = fullArgs.match(/^['"]?(\$[A-Za-z_]\w*(?:\[[^\]]+\])*(?:\.[A-Za-z_]\w*)*)['"]?\s*=\s*([\s\S]+)$/);
   ```
   - The `['"]?` makes quotes optional on both sides
   - Matches both `'$var'` and `$var`

3. **'to' keyword support**
   - SugarCube automatically converts `to` → `=` (line 191 comment)
   - So `<<th-set $var to 10>>` becomes `<<th-set $var = 10>>` before parsing

## Recommended Documentation Update

The current codebase uses quoted syntax everywhere, which creates the impression that quotes are required. To improve adoption:

### Update All Examples

**From (current):**
```twee
<<th-set '$variable' to 10>>
<<th-set '$users[$role].stats' += 5>>
```

**To (recommended):**
```twee
<<th-set $variable to 10>>
<<th-set $users[$role].stats += 5>>
```

This matches the familiar `<<set>>` syntax exactly!

### When Quotes Are Actually Needed

Quotes are only needed in **`<<sendAction>>`** when using dynamic paths:

```twee
// Dynamic path requires quotes or temporary variable
<<set _path = '$users["' + $role + '"].score'>>
<<sendAction _path 100>>

// OR use quotes directly
<<sendAction '$users["Marina"].score' 100>>
```

But for `<<th-set>>`, quotes are **optional**.

## Testing Recommendation

Add a test to the Comprehensive Test Suite to verify both syntaxes work:

```twee
:: Syntax Compatibility Test
<<liveblock>>
<h2>th-set Syntax Test</h2>

<h4>Test 1: Unquoted syntax (like regular <<set>>)</h4>
<<button "Unquoted: <<th-set $testVar to 42>>">>
  <<th-set $testVar to 42>>
<</button>>
Result: <<print $testVar>>
<br><br>

<h4>Test 2: Quoted syntax (currently documented)</h4>
<<button "Quoted: <<th-set '$testVar' to 99>>">>
  <<th-set '$testVar' to 99>>
<</button>>
Result: <<print $testVar>>
<br><br>

<h4>Test 3: Complex path unquoted</h4>
<<button "Unquoted complex: <<th-set $users[$role].testValue to 'success'>>">>
  <<th-set $users[$role].testValue to 'success'>>
<</button>>
Result: <<print $users[$role].testValue>>

<</liveblock>>
```

## Benefits of Using Unquoted Syntax

### 1. **Easier Migration**
Developers can do simple find-replace:
```
Find:    <<set
Replace: <<th-set
```

Instead of having to add quotes to every variable:
```
<<set $var = 10>>           → <<th-set '$var' to 10>>    (requires manual editing)
<<set $var = 10>>           → <<th-set $var to 10>>      (simple find-replace!)
```

### 2. **Familiar to SugarCube Developers**
No learning curve - syntax is identical to `<<set>>`

### 3. **Less Typing**
```twee
// Quoted (26 characters)
<<th-set '$variable' to 10>>

// Unquoted (24 characters)
<<th-set $variable to 10>>
```

### 4. **Easier to Read**
```twee
// Current style
<<th-set '$users[$role]["choices"]["vote"]' to 1>>

// Unquoted (cleaner!)
<<th-set $users[$role]["choices"]["vote"] to 1>>
```

## Action Items

1. **Verify unquoted syntax works** - Run the test above in the browser

2. **Update documentation** - Change all examples to use unquoted syntax

3. **Refactor existing code** (optional) - Convert quoted to unquoted for consistency:
   ```bash
   # Find all th-set instances with quotes
   grep -r "<<th-set '\$" Twine/Aztec/

   # Could potentially automate conversion with sed:
   # sed -i "s/<<th-set '\(\$[^']*\)' to /<<th-set \1 to /g" file.twee
   ```

4. **Update elizabeth2refactor.md** - Document that quotes are optional

## Potential Issue: Edge Cases

The unquoted syntax might have issues with:

### Complex expressions with nested quotes
```twee
// Might be ambiguous
<<th-set $var to "string with 'quotes' inside">>

// Safer with explicit quoting
<<th-set '$var' to "string with 'quotes' inside">>
```

### Solution: Test thoroughly
If any edge cases fail, document them and recommend quotes for those cases only.

## Conclusion

**The macro already supports both syntaxes!** The quoted syntax is used throughout the codebase, but **there's no technical requirement for it**. Switching to unquoted syntax would:

- ✅ Make migration from `<<set>>` trivial (find-replace)
- ✅ Reduce learning curve for SugarCube developers
- ✅ Improve code readability
- ✅ Require no code changes to the macro itself

The only change needed is **documentation and examples**.
