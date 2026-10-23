from PIL import Image
import numpy as np

# Load images
names = ['center', 'left', 'right', 'up', 'down', 'upper-left', 'lower-left']
images = {name: np.array(Image.open(f'assets/portrait/gaze-{name}.png').convert('L')) for name in names}

# Let's inspect each image compared to center:
# Where does the face / gaze shift?
c = images['center']

print(f"{'IMAGE':15s} | {'LEFT EYE (dx, dy)':20s} | {'RIGHT EYE (dx, dy)':20s}")
print("-" * 65)

for name in names:
    arr = images[name]
    # Crop Left eye: y=105:125, x=75:105
    # Crop Right eye: y=105:125, x=118:148
    
    # Let's find darkest 8% in Left eye:
    l_patch = arr[105:125, 75:105]
    tl = np.percentile(l_patch, 8)
    yl, xl = np.where(l_patch <= tl)
    
    r_patch = arr[105:125, 118:148]
    tr = np.percentile(r_patch, 8)
    yr, xr = np.where(r_patch <= tr)
    
    # Centers relative to center image
    c_l_patch = c[105:125, 75:105]
    c_tl = np.percentile(c_l_patch, 8)
    c_yl, c_xl = np.where(c_l_patch <= c_tl)
    
    c_r_patch = c[105:125, 118:148]
    c_tr = np.percentile(c_r_patch, 8)
    c_yr, c_xr = np.where(c_r_patch <= c_tr)
    
    dx_l = np.mean(xl) - np.mean(c_xl)
    dy_l = np.mean(yl) - np.mean(c_yl)
    
    dx_r = np.mean(xr) - np.mean(c_xr)
    dy_r = np.mean(yr) - np.mean(c_yr)
    
    print(f"gaze-{name:10s} | dx={dx_l:+5.1f}, dy={dy_l:+5.1f}   | dx={dx_r:+5.1f}, dy={dy_r:+5.1f}")
