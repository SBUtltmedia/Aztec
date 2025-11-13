#!/usr/bin/env python3
"""
Convert SugarCube <<set $variable>> macros to <<th-set>> server-authoritative format.

This script converts:
- <<set $var = value>> to <<th-set '$var' to value>>
- <<set $var += value>> to <<th-set '$var' += value>>
- <<set $var -= value>> to <<th-set '$var' -= value>>
- <<set $var *= value>> to <<th-set '$var' *= value>>
- <<set $var /= value>> to <<th-set '$var' /= value>>

It preserves:
- <<set _localVar = value>> (temporary variables don't need conversion)
- Proper handling of nested structures like $users[$role]["stats"]["Strength"]
"""

import re
import sys
import os
from pathlib import Path

def convert_set_to_thset(content):
    """
    Convert <<set $variable...>> to <<th-set '$variable' ...>>

    Handles various formats:
    - Simple assignment: <<set $var = value>>
    - Compound operators: <<set $var += value>>
    - Complex paths: <<set $users[$role]["stats"]["Strength"] += 1>>
    """

    # Count conversions for reporting
    conversions = 0

    # Pattern to match <<set $variable...>> but NOT <<set _variable...>>
    # We use a more specific pattern to avoid matching local variables
    def replace_set_macro(match):
        nonlocal conversions
        full_match = match.group(0)
        inner_content = match.group(1)

        # Skip if it's a local variable (starts with _)
        if inner_content.strip().startswith('_'):
            return full_match

        # Skip if it doesn't contain a $ (shouldn't happen, but safety check)
        if '$' not in inner_content:
            return full_match

        # Pattern 1: Compound operators (+=, -=, *=, /=)
        compound_match = re.match(r'^\s*(\$[^\s=]+)\s*([\+\-\*\/])=\s*(.+)\s*$', inner_content)
        if compound_match:
            var_path = compound_match.group(1)
            operator = compound_match.group(2)
            value = compound_match.group(3)
            conversions += 1
            return f"<<th-set '{var_path}' {operator}= {value}>>"

        # Pattern 2: Regular assignment with =
        assign_match = re.match(r'^\s*(\$[^\s=]+)\s*=\s*(.+)\s*$', inner_content)
        if assign_match:
            var_path = assign_match.group(1)
            value = assign_match.group(2)
            conversions += 1
            return f"<<th-set '{var_path}' to {value}>>"

        # If we can't parse it, leave it unchanged and warn
        print(f"WARNING: Could not parse: {full_match}", file=sys.stderr)
        return full_match

    # Match <<set ...>> where ... doesn't contain another <<
    # This handles single-line set macros
    pattern = r'<<set\s+([^<>]+)>>'
    converted = re.sub(pattern, replace_set_macro, content)

    return converted, conversions


def process_file(filepath, dry_run=False):
    """Process a single twee file."""
    print(f"\nProcessing: {filepath}")

    with open(filepath, 'r', encoding='utf-8') as f:
        original_content = f.read()

    converted_content, conversions = convert_set_to_thset(original_content)

    if conversions == 0:
        print(f"  No conversions needed")
        return 0

    print(f"  Converted {conversions} macros")

    if not dry_run:
        # Create backup
        backup_path = filepath.with_suffix(filepath.suffix + '.backup')
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(original_content)
        print(f"  Backup saved to: {backup_path}")

        # Write converted content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(converted_content)
        print(f"  Converted file saved")
    else:
        print(f"  DRY RUN - no changes made")

    return conversions


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Convert <<set $var>> to <<th-set>> in Twine twee files'
    )
    parser.add_argument(
        'path',
        help='Path to twee file or directory containing twee files'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be converted without making changes'
    )

    args = parser.parse_args()

    path = Path(args.path)

    if not path.exists():
        print(f"Error: Path does not exist: {path}", file=sys.stderr)
        sys.exit(1)

    # Collect files to process
    if path.is_file():
        files = [path]
    else:
        files = sorted(path.glob('*.twee'))

    if not files:
        print(f"No .twee files found in: {path}", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(files)} twee file(s) to process")

    if args.dry_run:
        print("\n*** DRY RUN MODE - NO CHANGES WILL BE MADE ***\n")

    total_conversions = 0
    for filepath in files:
        conversions = process_file(filepath, dry_run=args.dry_run)
        total_conversions += conversions

    print(f"\n{'Would convert' if args.dry_run else 'Converted'} {total_conversions} total macros across {len(files)} files")

    if not args.dry_run:
        print("\nBackup files created with .backup extension")
        print("Review the changes and delete backups when satisfied")


if __name__ == '__main__':
    main()
