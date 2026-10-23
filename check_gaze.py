from PIL import Image
import numpy as np

files = [
    'gaze-center.png',
    'gaze-left.png',
    'gaze-right.png',
    'gaze-up.png',
    'gaze-down.png',
    'gaze-upper-left.png',
    'gaze-lower-left.png'
]

# Let's write an HTML file to preview them
with open('preview_eyes.html', 'w') as f:
    f.write('<!DOCTYPE html><html><head><title>Portrait Gaze Preview</title></head>')
    f.write('<body style="background:#222;color:#eee;font-family:sans-serif;padding:20px;">')
    f.write('<h2>Portrait Images Inspection</h2><div style="display:flex;flex-wrap:wrap;gap:20px;">')
    for fname in files:
        f.write(f'<div style="background:#333;padding:10px;border-radius:8px;text-align:center;">')
        f.write(f'<img src="assets/portrait/{fname}" style="width:205px;height:276px;display:block;margin-bottom:8px;">')
        f.write(f'<strong>{fname}</strong></div>')
    f.write('</div></body></html>')

print('preview_eyes.html generated successfully.')
