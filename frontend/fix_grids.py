import os
import glob
import re

for f in glob.glob('app/**/*.tsx', recursive=True):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    modified = False
    
    # Replace exact string matches
    replacements = {
        'className="grid grid-cols-2 gap-4"': 'className="grid grid-cols-1 md:grid-cols-2 gap-4"',
        'className="grid grid-cols-4 gap-4 mt-6"': 'className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6"',
        'className="grid grid-cols-4 gap-4 text-sm"': 'className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"'
    }
    
    for old, new in replacements.items():
        if old in content:
            content = content.replace(old, new)
            modified = True

    if modified:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Fixed grids in {f}")
