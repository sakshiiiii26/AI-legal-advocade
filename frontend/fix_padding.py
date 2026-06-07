import os
import glob

for f in glob.glob('app/**/*.tsx', recursive=True):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if 'className="p-8"' in content:
        new_content = content.replace('className="p-8"', 'className="p-4 md:p-8"')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f"Updated {f}")
