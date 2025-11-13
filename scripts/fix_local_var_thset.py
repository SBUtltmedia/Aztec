#!/usr/bin/env python3
"""
Fix th-set macros that use local variables in their value expressions.
These need to be converted to use <<sendAction>> instead since <<th-set>>
uses skipArgs: true and can't evaluate local variables.
"""

import re
from pathlib import Path

def fix_local_var_thset(content):
    """
    Convert: <<th-set '$var' to _localVar>>
    To: <<sendAction "$var" _localVar>>
    """

    fixes = 0

    def replace_local_var(match):
        nonlocal fixes
        var_path = match.group(1)  # The '$variable' path
        value_expr = match.group(2).strip()  # The value expression

        # Check if value contains a local variable reference (starts with _ or contains space + _)
        if re.search(r'(^_[a-zA-Z]|\s_[a-zA-Z]|/_)', value_expr):
            fixes += 1
            return f'<<sendAction "{var_path}" {value_expr}>>'

        return match.group(0)

    # Match <<th-set 'variable' to expression>>
    pattern = r"<<th-set\s+'([^']+)'\s+to\s+([^>]+)>>"
    converted = re.sub(pattern, replace_local_var, content)

    return converted, fixes


def main():
    aztec_dir = Path('/Users/pstdenis/Desktop/Aztec/Twine/Aztec')

    total_fixes = 0
    files_processed = 0

    for filepath in sorted(aztec_dir.glob('*.twee')):
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()

        fixed, count = fix_local_var_thset(original)

        if count > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed)
            print(f"{filepath.name}: Fixed {count} instances")
            files_processed += 1
            total_fixes += count

    print(f"\nTotal: Fixed {total_fixes} instances across {files_processed} files")


if __name__ == '__main__':
    main()
