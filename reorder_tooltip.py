import re

with open('app/dashboard-secretaria/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the hover area tooltip container
# Look for `{activeLegends.members && d.members !== null && (` inside the Hover Areas
start_idx = content.find('{activeLegends.members && d.members !== null && (')

# Let's extract the whole block inside the tooltip
tooltip_start = content.rfind('<div\n                        style={{\n                          position: "absolute",\n                          bottom: "100%",', 0, start_idx)
tooltip_end = content.find('</div>\n                      )}', start_idx) + 6

tooltip_content = content[tooltip_start:tooltip_end]

# Extract the 4 blocks
members_start = tooltip_content.find('{activeLegends.members && d.members !== null && (')
visitors_start = tooltip_content.find('{activeLegends.visitors && d.visitors !== null && (')
converting_start = tooltip_content.find('{activeLegends.converting && d.converting !== null && (')
total_start = tooltip_content.find('{activeLegends.total && d.total !== null && (')

# If total_start is not found, let's just find where converting ends
if total_start == -1:
    # Actually total is just `{activeLegends.total && d.total !== null && (` ? 
    # Let's check how it's written.
    pass

# Instead of strict parsing, let's use regex to grab each of the 4 JSX conditional blocks
block_pattern = re.compile(r'\{activeLegends\.(members|visitors|converting|total).*?\}\)', re.DOTALL)
blocks = {m.group(1): m.group(0) for m in block_pattern.finditer(tooltip_content)}

if len(blocks) >= 4:
    # Reorder: visitors, converting, members, total
    new_blocks = f"\n                        {blocks['visitors']}\n                        {blocks['converting']}\n                        {blocks['members']}\n                        {blocks['total']}\n                        "
    
    # We replace from the first block's start to the last block's end inside the content
    first_block_start = tooltip_content.find('{activeLegends.members && d.members !== null && (')
    last_block_end = tooltip_content.find('})', tooltip_content.find('{activeLegends.total')) + 2
    
    new_tooltip_content = tooltip_content[:first_block_start] + new_blocks + tooltip_content[last_block_end:]
    
    content = content.replace(tooltip_content, new_tooltip_content)
    
    with open('app/dashboard-secretaria/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print(f"Failed to find all 4 blocks. Found: {list(blocks.keys())}")
