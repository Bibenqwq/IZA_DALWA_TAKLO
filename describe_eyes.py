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

# Let's inspect the white of the eye (sclera) vs the dark iris
# In the right eye (viewer's right, x=122..146, y=108..122):
# If sclera is on the right side of the iris, iris is on the left -> looking left
# If sclera is on the left side of the iris, iris is on the right -> looking right
for f in files:
    im = Image.open('assets/portrait/' + f).convert('L')
    arr = np.array(im)
    r_eye = arr[108:122, 122:146]
    
    # Left half vs Right half of right eye
    w = r_eye.shape[1]
    left_half = r_eye[:, :w//2]
    right_half = r_eye[:, w//2:]
    
    # Upper half vs Lower half
    h = r_eye.shape[0]
    top_half = r_eye[:h//2, :]
    bot_half = r_eye[h//2:, :]
    
    # Iris is darker (lower mean)
    l_mean = np.mean(left_half)
    r_mean = np.mean(right_half)
    t_mean = np.mean(top_half)
    b_mean = np.mean(bot_half)
    
    h_gaze = "LEFT (viewer's left)" if l_mean < r_mean else "RIGHT (viewer's right)"
    v_gaze = "UP" if t_mean < b_mean else "DOWN"
    diff_h = abs(l_mean - r_mean)
    diff_v = abs(t_mean - b_mean)
    
    print(f"{f:22s} -> {h_gaze:25s} (diff={diff_h:.1f}) | {v_gaze:5s} (diff={diff_v:.1f})")
