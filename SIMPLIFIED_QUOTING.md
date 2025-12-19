# Simplified Variable Quoting for `<<th-set>>`

## Summary

The `<<th-set>>` macro already supports both quoted and unquoted variable syntax (optional quotes). This eliminates the learning curve and makes migration from `<<set>>` trivial with simple find-replace operations.

## Current Implementation

The `<<th-set>>` macro in `/Users/pstdenis/Desktop/Aztec/Twine/Aztec.html` (line ~256) already supports both syntaxes:

### Quoted Syntax (Current Examples)
```twee
<<th-set '' to 10>>
<<th-set '[].stats' to 5>>
<<th-set '["Aztecs"].Strength' += 2>>
```

### Unquoted Syntax (Also Supported!)
```twee
<<th-set  to 10>>
<<th-set [].stats to 5>>
<<th-set ["Aztecs"].Strength += 2>>
```

## Technical Details

### Why It Works
1. `skipArgs: true` - SugarCube doesn't parse arguments, passes raw text to handler
2. Flexible regex pattern: `^['"]?` makes quotes optional
3. SugarCube converts `to` → `=` before parsing

### Regex Pattern
```javascript
const assignMatch = fullArgs.match(/^['"]?($[A-Za-z_]\w*(?:\[[^\]]+\])*(?:\.[A-Za-z_]\w*)*)['"]?\s*=\s*([\s\S]+)$/);
```

## Migration Benefits

### Simple Find-Replace
- Find: `<<set `
- Replace: `<<th-set `

### Familiar Syntax
- Identical to `<<set>>` for SugarCube developers
- No learning curve

### Less Typing
- `<<th-set  to 10>>` (24 chars) vs `<<th-set '' to 10>>` (26 chars)
- Cleaner complex paths: `<<th-set []["choices"]["vote"] to 1>>`

## Edge Cases

### When Quotes Are Useful

For strings with complex nested quotes:
```twee
// May be clearer with quotes
<<th-set '' to "String with 'nested' quotes">>
```

## Recommendation

### Update Documentation
Update all examples to show unquoted syntax as the preferred approach for consistency with standard SugarCube syntax.

### Code Examples
```twee
// Simple assignment
<<th-set  to 100>>

// Compound operators
<<th-set  += 5>>
<<th-set  -= 10>>

// Object properties
<<th-set [].currentLocation to "Tenochtitlan">>

// Array access
<<th-set [0] to "Sword">>

// Complex expressions
<<th-set  to ( + ) * >>
```

## Testing

The syntax has been tested in `/Users/pstdenis/Desktop/Aztec/Twine/Aztec/21_SyntaxTest.twee` with comprehensive tests for:
- Simple variables
- Object properties (dot notation)
- Array access
- Complex nested paths
- Compound operators
- String values
- Boolean values
- Complex expressions
- Faction variables

All tests pass with both quoted and unquoted syntax.
