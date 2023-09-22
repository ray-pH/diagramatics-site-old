#! /usr/bin/env python3

import os

# special files
with open('_template.html', 'r') as f:
    _template = f.read()
with open('_header.html', 'r') as f:
    _header = f.read()
with open('_navigation.html', 'r') as f:
    _navigation = f.read()

# replace the inner content of <div class="header"></div> in _template with _header
_template = _template.replace('<div class="header"></div>', f'<div class="header">{_header}</div>')
# replace the inner content of <div class="navigation"></div> in _template with _navigation
_template = _template.replace('<div class="navigation"></div>', f'<div class="navigation">{_navigation}</div>')

# list all *.html file that doesnt start with _ (underscore)
html_files = [f for f in os.listdir('./content/') if f.endswith('.html') and not f.startswith('_')]
for filename in html_files:
    # open the file
    with open(f'./content/{filename}', 'r') as f: 
        html_content = f.read()

    # change the title of the page
    title = (filename[0].upper() + filename[1:])[:-5]
    if title == 'Index': title = 'Guide'
    _template = _template.replace('<title></title>', f'<title>{title} : Diagramatics</title>')

    # replace the inner content of <div id="content"></div> in _template with htmlcontent
    html_full = _template.replace('<div id="content"></div>', f'<div id="content">{html_content}</div>')

    # write the result to a new file in ../guides/
    with open(f'../guides/{filename}', 'w') as f: 
        f.write(html_full)

    print('Created ../guides/' + filename)
