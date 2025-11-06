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
