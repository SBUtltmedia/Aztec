#!/usr/bin/env python3
"""
Fix redundant = in th-set macros caused by original typos.
Converts: <<th-set '$var' to $var = 1>>
To: <<th-set '$var' to 1>>
"""

import re
from pathlib import Path

def fix_redundant_equals(content):
    """Fix patterns where the value expression has redundant self-assignment."""

    fixes = 0

    def replace_redundant(match):
        nonlocal fixes
        var_path = match.group(1)  # The '$variable' in quotes
        full_expr = match.group(2).strip()  # The full expression after 'to'

        # Check if expression is: $variable = value
        # We need to extract just the value part
        redundant_pattern = re.escape(var_path) + r'\s*=\s*(.+)$'
        redundant_match = re.match(redundant_pattern, full_expr)

        if redundant_match:
            value = redundant_match.group(1).strip()
            fixes += 1
            return f"<<th-set '{var_path}' to {value}>>"

        return match.group(0)

    # Match <<th-set 'variable' to expression>>
    pattern = r"<<th-set\s+'([^']+)'\s+to\s+([^>]+)>>"
    converted = re.sub(pattern, replace_redundant, content)

    return converted, fixes


def main():
    aztec_dir = Path('/Users/pstdenis/Desktop/Aztec/Twine/Aztec')

    total_fixes = 0
    files_processed = 0

    for filepath in sorted(aztec_dir.glob('*.twee')):
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()

        fixed, count = fix_redundant_equals(original)

        if count > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed)
            print(f"{filepath.name}: Fixed {count} instances")
            files_processed += 1
            total_fixes += count

    print(f"\nTotal: Fixed {total_fixes} instances across {files_processed} files")


if __name__ == '__main__':
    main()
