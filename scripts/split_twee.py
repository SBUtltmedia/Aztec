
import re
import os

# Define topics and keywords
topics = {
    '00_Setup': ['StoryTitle', 'StoryData', 'Story Stylesheet', 'Story JavaScript'],
    '01_Aguilar': ['Aguilar'],
    '02_Cortes': ['Cortes'],
    '03_Moctezuma': ['Moctezuma'],
    '04_Aztec': ['Aztec', 'Mexica'],
    '05_Spanish': ['Spaniards', 'Spanish'],
    '06_Tlaxcalan': ['Tlaxcalan'],
    '07_Marina': ['Marina'],
    '08_Acts': ['Act '],
    '09_Library': ['Library'],
    '10_Control': ['Control:'],
    '11_Dashboard': ['Dashboard'],
    '12_Test': ['Test'],
    '13_Cholula': ['Cholula'],
    '14_Tenochtitlan': ['Tenochtitlan', 'Tenochtitlán'],
    '15_Veracruz': ['Veracruz'],
    '16_Riot': ['Riot'],
}

input_file = '/Users/pstdenis/Desktop/Aztec/Twine/Aztec.twee'
output_dir = '/Users/pstdenis/Desktop/Aztec/Twine/Aztec'

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Split by passage marker, keeping the content before the first passage (if any)
parts = content.split('\n:: ')
initial_content = parts[0]
passages = [':: ' + p for p in parts[1:]] # Add the marker back

# A dictionary to hold passages for each topic
categorized_passages = {topic: [] for topic in topics}
categorized_passages['99_Uncategorized'] = []

# Handle content before the first passage, if it's not just whitespace
if initial_content.strip():
    categorized_passages['99_Uncategorized'].append(initial_content)

for p in passages:
    # The title is the first line, removing the ':: '
    title_line = p.split('\n', 1)[0][3:]
    
    found_category = False
    for category, keywords in topics.items():
        for keyword in keywords:
            if keyword.lower() in title_line.lower():
                categorized_passages[category].append(p)
                found_category = True
                break
        if found_category:
            break
    
    if not found_category:
        categorized_passages['99_Uncategorized'].append(p)

for category, p_list in categorized_passages.items():
    if p_list:
        # Sanitize category name for filename
        filename = f'{category}.twee'
        with open(os.path.join(output_dir, filename), 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(p_list))
            f.write('\n') # Add a newline at the end of the file
