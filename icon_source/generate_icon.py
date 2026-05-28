#!/usr/bin/env python3
"""生成雅思爹 App 像素风图标"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_pixel_beard_man(size=1024):
    """创建像素风络腮胡眼镜男头像"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 颜色定义
    BG = (237, 104, 17, 255)       # 橙色背景 #ED6811
    SKIN = (255, 220, 170, 255)    # 肤色
    HAIR = (60, 40, 20, 255)       # 深棕色头发/胡须
    GLASS_FRAME = (40, 40, 40, 255)# 眼镜框 深色
    EYE = (40, 40, 40, 255)        # 眼睛
    WHITE = (255, 255, 255, 255)   # 白色（眼白）
    SHIRT = (237, 104, 17, 255)    # 衣服橙色
    COLLAR = (255, 255, 255, 255)  # 领子白色
    SHADOW = (200, 80, 10, 255)    # 深橙阴影

    s = size / 1024  # 缩放因子

    def r(x): return int(x * s)
    def rect(x1, y1, x2, y2, color):
        draw.rectangle([r(x1), r(y1), r(x2), r(y2)], fill=color)
    def circle(cx, cy, radius, color):
        draw.ellipse([r(cx-radius), r(cy-radius), r(cx+radius), r(cy+radius)], fill=color)
    def ring(cx, cy, outer, inner, color):
        draw.ellipse([r(cx-outer), r(cy-outer), r(cx+outer), r(cy+outer)], fill=color)
        draw.ellipse([r(cx-inner), r(cy-inner), r(cx+inner), r(cy+inner)], fill=(0,0,0,0))

    # 背景圆角矩形
    draw.rounded_rectangle([0, 0, size-1, size-1], radius=r(180), fill=BG)

    # === 头部 ===
    # 头发（顶部）
    circle(512, 310, 220, HAIR)
    rect(292, 310, 732, 530, SKIN)

    # 脸部皮肤（椭圆）
    draw.ellipse([r(292), r(310), r(732), r(700)], fill=SKIN)

    # 头发覆盖顶部
    rect(292, 90, 732, 360, HAIR)
    circle(512, 310, 220, HAIR)
    # 头发底部边界-让脸露出来
    rect(292, 340, 732, 420, SKIN)
    draw.ellipse([r(292), r(310), r(732), r(600)], fill=SKIN)

    # 耳朵
    circle(282, 510, 45, SKIN)
    circle(742, 510, 45, SKIN)

    # === 眼镜 ===
    # 左镜片（白底）
    circle(390, 490, 90, WHITE)
    # 右镜片（白底）
    circle(634, 490, 90, WHITE)
    # 左镜片边框
    ring(390, 490, 90, 75, GLASS_FRAME)
    # 右镜片边框
    ring(634, 490, 90, 75, GLASS_FRAME)
    # 连接桥
    rect(480, 478, 544, 502, GLASS_FRAME)
    # 眼镜腿
    rect(205, 474, 300, 494, GLASS_FRAME)
    rect(724, 474, 819, 494, GLASS_FRAME)

    # === 眼睛 ===
    # 左眼
    circle(390, 490, 42, EYE)
    circle(378, 478, 14, WHITE)  # 高光
    # 右眼
    circle(634, 490, 42, EYE)
    circle(622, 478, 14, WHITE)  # 高光

    # === 鼻子 ===
    circle(512, 575, 28, (220, 180, 140, 255))
    circle(492, 575, 14, (200, 160, 120, 255))
    circle(532, 575, 14, (200, 160, 120, 255))

    # === 胡须（络腮胡）===
    # 上唇髭
    rect(430, 610, 594, 638, HAIR)
    # 嘴巴（在胡须里）
    draw.arc([r(450), r(630), r(574), r(680)], start=0, end=180, fill=(180, 100, 60, 255), width=r(8))
    # 下巴胡子（大块）
    draw.ellipse([r(340), r(620), r(684), r(790)], fill=HAIR)
    # 遮住脸下半部分多余胡子，保留胡子形状
    # 两侧连鬓胡
    rect(292, 570, 370, 720, HAIR)
    rect(654, 570, 732, 720, HAIR)

    # === 脖子和身体 ===
    rect(440, 750, 584, 840, SKIN)
    # 衬衣领子
    rect(350, 830, 674, 1024, (50, 50, 100, 255))
    # 白领
    draw.polygon([
        (r(440), r(840)), (r(390), r(960)), (r(512), r(900)),
        (r(634), r(960)), (r(584), r(840))
    ], fill=COLLAR)

    return img


def save_all_sizes(img, base_dir):
    """保存所有Android所需尺寸"""
    sizes = {
        'mdpi': 48,
        'hdpi': 72,
        'xhdpi': 96,
        'xxhdpi': 144,
        'xxxhdpi': 192,
    }
    
    for dpi, size in sizes.items():
        resized = img.resize((size, size), Image.LANCZOS)
        # 保存为圆形版本
        round_img = make_round(resized)
        
        out_dir = os.path.join(base_dir, f'mipmap-{dpi}')
        os.makedirs(out_dir, exist_ok=True)
        
        # ic_launcher (标准)
        resized.save(os.path.join(out_dir, 'ic_launcher.png'))
        # ic_launcher_round (圆形)
        round_img.save(os.path.join(out_dir, 'ic_launcher_round.png'))
        # ic_launcher_foreground (前景)
        # foreground 通常是108dp，对应432px(xxxhdpi)
        fg_size = int(size * 1.5)
        fg = img.resize((fg_size, fg_size), Image.LANCZOS)
        fg_canvas = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
        fg_canvas.paste(fg, (0, 0))
        fg_canvas.save(os.path.join(out_dir, 'ic_launcher_foreground.png'))
        
        print(f'OK {dpi}: {size}x{size}')
    
    # 也保存原始 1024px 版本
    img.save(os.path.join(base_dir, 'icon_1024.png'))
    print(f'OK: 1024x1024')
    
    # 保存 PWA 图标
    img.resize((192, 192), Image.LANCZOS).save(os.path.join(base_dir, 'icon-192.png'))
    img.resize((512, 512), Image.LANCZOS).save(os.path.join(base_dir, 'icon-512.png'))
    print(f'OK PWA: 192x192, 512x512')


def make_round(img):
    """创建圆形图标"""
    size = img.size[0]
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([0, 0, size-1, size-1], fill=255)
    
    result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    result.paste(img, mask=mask)
    return result


if __name__ == '__main__':
    print('Generating icon...')
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    icon = create_pixel_beard_man(1024)
    save_all_sizes(icon, base_dir)
    print('\nAll icons generated!')
