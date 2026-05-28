#!/usr/bin/env python3
"""Convert SVG icon to Android app icons using PIL"""
from PIL import Image, ImageDraw
import os

# Android icon sizes
SIZES = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
}

BASE_DIR = r'C:\Users\lxsn8\WorkBuddy\20260401143123\damov-app'

def draw_pixel_icon(size, transparent_bg=False):
    """Draw the pixel art icon at given size"""
    if transparent_bg:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    else:
        img = Image.new('RGBA', (size, size), (74, 144, 217, 255))
    draw = ImageDraw.Draw(img)
    
    # Scale factor (original SVG is 64x64)
    scale = size / 64.0
    
    def s(val):
        return int(val * scale)
    
    # Background - Blue #4A90D9 (only if not transparent)
    if not transparent_bg:
        draw.rectangle([0, 0, size, size], fill=(74, 144, 217, 255))
    
    # Face base - Skin color #F5D0A9
    draw.rectangle([s(16), s(12), s(48), s(52)], fill=(245, 208, 169, 255))
    
    # Hair - Dark brown #4A3728
    draw.rectangle([s(12), s(8), s(52), s(20)], fill=(74, 55, 40, 255))
    draw.rectangle([s(12), s(8), s(20), s(28)], fill=(74, 55, 40, 255))
    draw.rectangle([s(44), s(8), s(52), s(28)], fill=(74, 55, 40, 255))
    
    # Beard - Dark brown #4A3728
    draw.rectangle([s(16), s(36), s(48), s(52)], fill=(74, 55, 40, 255))
    draw.rectangle([s(12), s(32), s(20), s(52)], fill=(74, 55, 40, 255))
    draw.rectangle([s(44), s(32), s(52), s(52)], fill=(74, 55, 40, 255))
    draw.rectangle([s(20), s(48), s(44), s(56)], fill=(74, 55, 40, 255))
    
    # Glasses frame - Dark gray #333
    draw.rectangle([s(14), s(22), s(30), s(34)], fill=(51, 51, 51, 255))
    draw.rectangle([s(34), s(22), s(50), s(34)], fill=(51, 51, 51, 255))
    draw.rectangle([s(30), s(26), s(34), s(30)], fill=(51, 51, 51, 255))
    
    # Glasses lenses - Light blue #87CEEB
    draw.rectangle([s(16), s(24), s(28), s(32)], fill=(135, 206, 235, 255))
    draw.rectangle([s(36), s(24), s(48), s(32)], fill=(135, 206, 235, 255))
    
    # Eyes - Black
    draw.rectangle([s(18), s(26), s(22), s(30)], fill=(0, 0, 0, 255))
    draw.rectangle([s(38), s(26), s(42), s(30)], fill=(0, 0, 0, 255))
    
    # Nose - Darker skin #E8B896
    draw.rectangle([s(28), s(32), s(36), s(38)], fill=(232, 184, 150, 255))
    
    # Mouth - Brown #8B4513
    draw.rectangle([s(24), s(42), s(40), s(46)], fill=(139, 69, 19, 255))
    
    return img

def convert_icon():
    for density, size in SIZES.items():
        output_dir = os.path.join(BASE_DIR, 'android', 'app', 'src', 'main', 'res', f'mipmap-{density}')
        
        # Generate ic_launcher.png (legacy icon with background)
        output_file = os.path.join(output_dir, 'ic_launcher.png')
        img = draw_pixel_icon(size, transparent_bg=False)
        img.save(output_file, 'PNG')
        print(f"Generated: {output_file} ({size}x{size})")
        
        # Generate ic_launcher_foreground.png (for adaptive icons, transparent bg)
        foreground_file = os.path.join(output_dir, 'ic_launcher_foreground.png')
        img_fg = draw_pixel_icon(size, transparent_bg=True)
        img_fg.save(foreground_file, 'PNG')
        print(f"Generated: {foreground_file} ({size}x{size})")
        
        # Generate ic_launcher_round.png (round icon)
        round_file = os.path.join(output_dir, 'ic_launcher_round.png')
        img_round = draw_pixel_icon(size, transparent_bg=False)
        # Make it round by creating a circular mask
        mask = Image.new('L', (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse([0, 0, size, size], fill=255)
        img_round.putalpha(mask)
        img_round.save(round_file, 'PNG')
        print(f"Generated: {round_file} ({size}x{size})")
    
    # Also generate PWA icons
    pwa_dir = os.path.join(BASE_DIR, 'public')
    
    # icon-192.png
    img = draw_pixel_icon(192, transparent_bg=False)
    img.save(os.path.join(pwa_dir, 'icon-192.png'), 'PNG')
    print(f"Generated: {os.path.join(pwa_dir, 'icon-192.png')} (192x192)")
    
    # icon-512.png
    img = draw_pixel_icon(512, transparent_bg=False)
    img.save(os.path.join(pwa_dir, 'icon-512.png'), 'PNG')
    print(f"Generated: {os.path.join(pwa_dir, 'icon-512.png')} (512x512)")
    
    print("\nAll icons generated successfully!")

if __name__ == '__main__':
    convert_icon()
