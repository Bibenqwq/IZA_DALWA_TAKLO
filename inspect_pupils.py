from PIL import Image
import numpy as np

# Load gaze-center as baseline
center_img = Image.open('assets/portrait/gaze-center.png').convert('L')
c_arr = np.array(center_img, dtype=float)

# In the 205x276 portrait, let's locate the two eye centers in gaze-center.png
# Viewer left eye: x in [70, 105], y in [105, 125]
# Viewer right eye: x in [118, 148], y in [105, 125]

files = [
    'gaze-center.png',
    'gaze-left.png',
    'gaze-right.png',
    'gaze-up.png',
    'gaze-down.png',
    'gaze-upper-left.png',
    'gaze-lower-left.png'
]

print("=== DETAILED PUPIL ANALYSIS ===")
for fname in files:
    im = Image.open('assets/portrait/' + fname).convert('L')
    arr = np.array(im, dtype=float)
    
    # Left eye:
    l_crop = arr[106:124, 72:102]
    # Right eye:
    r_crop = arr[106:124, 118:148]
    
    # Threshold for dark iris
    tl = np.percentile(l_crop, 12)
    tr = np.percentile(r_crop, 12)
    
    yl, xl = np.where(l_crop <= tl)
    yr, xr = np.where(r_crop <= tr)
    
    l_cx = np.mean(xl) + 72
    l_cy = np.mean(yl) + 106
    r_cx = np.mean(xr) + 118
    r_cy = np.mean(yr) + 106
    
    # Center of both pupils:
    pupil_x = (l_cx + r_cx) / 2.0
    pupil_y = (l_cy + r_cy) / 2.0
    
    print(f"{fname:20s} -> Pupil Midpoint: x={pupil_x:.2f}, y={pupil_y:.2f}")
