import os
import json
import glob
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WIDTH, HEIGHT = 1200, 630
SCALE = 2
W, H = WIDTH * SCALE, HEIGHT * SCALE

font_dir = 'C:\\Windows\\Fonts'
f_tag = ImageFont.truetype(os.path.join(font_dir, 'segoeuib.ttf'), 18 * SCALE)
f_title_lg = ImageFont.truetype(os.path.join(font_dir, 'segoeuib.ttf'), 48 * SCALE)
f_title_md = ImageFont.truetype(os.path.join(font_dir, 'segoeuib.ttf'), 40 * SCALE)
f_title_sm = ImageFont.truetype(os.path.join(font_dir, 'segoeuib.ttf'), 34 * SCALE)
f_desc = ImageFont.truetype(os.path.join(font_dir, 'segoeui.ttf'), 22 * SCALE)
f_brand = ImageFont.truetype(os.path.join(font_dir, 'segoeuib.ttf'), 18 * SCALE)
f_sub = ImageFont.truetype(os.path.join(font_dir, 'segoeui.ttf'), 16 * SCALE)
f_vs = ImageFont.truetype(os.path.join(font_dir, 'segoeuib.ttf'), 20 * SCALE)
f_appName = ImageFont.truetype(os.path.join(font_dir, 'segoeuib.ttf'), 16 * SCALE)

os.makedirs('public/guides', exist_ok=True)

with open('src/data/catalog.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

apps_by_name = {a['name'].lower(): a for a in catalog['apps']}
apps_by_slug = {a['slug'].lower(): a for a in catalog['apps']}

def get_icon_path(slug):
    local_p = os.path.join('temp_guide_icons', slug + '.png')
    if os.path.exists(local_p):
        return local_p
    pub_p = os.path.join('public', 'apps', slug + '.png')
    if os.path.exists(pub_p):
        return pub_p
    return None

def make_rounded_icon(src_path, size, radius=18*SCALE):
    if not src_path or not os.path.exists(src_path):
        return None
    try:
        im = Image.open(src_path).convert('RGBA')
        im = im.resize((size, size), Image.Resampling.LANCZOS)
        mask = Image.new('L', (size, size), 0)
        mdraw = ImageDraw.Draw(mask)
        mdraw.rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
        rounded = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        rounded.paste(im, (0, 0), mask)
        # Ring border
        ring = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        rdraw = ImageDraw.Draw(ring)
        rdraw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, outline=(255, 255, 255, 45), width=int(1.5 * SCALE))
        return Image.alpha_composite(rounded, ring)
    except Exception as e:
        return None

# Aesthetic palette per topic
THEMES = {
    'cyan': {'glow': (56, 189, 248), 'accent': (56, 189, 248), 'tag_bg': (12, 74, 96, 220), 'tag_txt': (186, 230, 253)},
    'amber': {'glow': (245, 158, 11), 'accent': (251, 191, 36), 'tag_bg': (120, 53, 15, 220), 'tag_txt': (254, 243, 199)},
    'violet': {'glow': (168, 85, 247), 'accent': (192, 132, 252), 'tag_bg': (88, 28, 135, 220), 'tag_txt': (243, 232, 255)},
    'emerald': {'glow': (16, 185, 129), 'accent': (52, 211, 153), 'tag_bg': (6, 78, 59, 220), 'tag_txt': (209, 250, 229)},
    'rose': {'glow': (244, 63, 94), 'accent': (251, 113, 133), 'tag_bg': (136, 19, 55, 220), 'tag_txt': (255, 228, 230)},
    'indigo': {'glow': (99, 102, 241), 'accent': (129, 140, 248), 'tag_bg': (49, 46, 129, 220), 'tag_txt': (224, 231, 255)},
}

GUIDE_CONFIG = {
    'must-have-mac-apps-2026': {
        'theme': 'amber',
        'badge': '2026 EDITION • EDITORIAL BUYER GUIDE',
        'title': 'Must-Have Mac Apps for 2026',
        'highlight': 'Essential Everyday Toolkit',
        'desc': 'Hand-picked utilities for window management, screenshots, audio & productivity.',
        'app_slugs': ['shottr', 'clearbar', 'lounge', 'macwhisper', 'anytype', 'helumi'],
        'layout': 'grid'
    },
    'best-free-mac-apps': {
        'theme': 'emerald',
        'badge': '100% FREE & FREEMIUM • NO SUBSCRIPTION',
        'title': 'Best Free Mac Apps (2026)',
        'highlight': 'Zero Cost Power Utilities',
        'desc': 'Top free macOS apps that outperform expensive paid software.',
        'app_slugs': ['shottr', 'better-shot', 'voicera', 'anytype', 'precis', 'mole'],
        'layout': 'grid'
    },
    'best-clipboard-manager-mac': {
        'theme': 'cyan',
        'badge': 'PRODUCTIVITY UTILITY SHOWDOWN',
        'title': 'Best Clipboard Managers for Mac',
        'highlight': 'Pin, Search & Paste Fast',
        'desc': 'Comparing lightweight menu bar clipboards with native macOS performance.',
        'app_slugs': ['clippio', 'maclip', 'tucket'],
        'layout': 'featured'
    },
    'best-notes-app-mac': {
        'theme': 'indigo',
        'badge': 'WRITING & PKM ROUNDUP',
        'title': 'Best Notes Apps for Mac (2026)',
        'highlight': 'Calm, Markdown & Local-First',
        'desc': 'From distraction-free markdown to networked local knowledge graphs.',
        'app_slugs': ['ia-writer', 'anytype'],
        'layout': 'featured'
    },
    'best-mac-disk-space-analyzer': {
        'theme': 'rose',
        'badge': 'STORAGE CLEANUP TEST',
        'title': 'Best Mac Disk Space Analyzers',
        'highlight': 'Reclaim 50GB+ Safely',
        'desc': 'Fast, modern visual disk analyzers for Apple Silicon and macOS Sequoia.',
        'app_slugs': ['mole', 'bytesweep', 'plumby', 'scanmydisk'],
        'layout': 'grid'
    },
    'best-notch-apps-mac': {
        'theme': 'violet',
        'badge': 'MACBOOK NOTCH ENHANCEMENTS',
        'title': 'Best Notch Apps for MacBook',
        'highlight': 'Turn Your Notch into a HUD',
        'desc': 'Live widgets, drop shelves, and media controls right inside the notch cutout.',
        'app_slugs': ['lounge', 'alcove', 'notchdodo', 'tucket'],
        'layout': 'grid'
    },
    'best-appcleaner-alternative-mac': {
        'theme': 'emerald',
        'badge': 'SAFE UNINSTALL UTILITIES',
        'title': 'Best AppCleaner Alternatives',
        'highlight': 'Deep App & Cache Cleanup',
        'desc': 'Remove leftover system files, caches, and hidden app remnants cleanly.',
        'app_slugs': ['mole', 'bytesweep', 'plumby'],
        'layout': 'featured'
    },
    'best-notchnook-alternative-mac': {
        'theme': 'cyan',
        'badge': 'DYNAMIC ISLAND & SHELF',
        'title': 'Best NotchNook Alternatives',
        'highlight': 'Lightweight Notch Shelves',
        'desc': 'Minimalist drag-and-drop notch panels without excessive resource draw.',
        'app_slugs': ['lounge', 'alcove', 'notchdodo'],
        'layout': 'featured'
    },
    'best-paste-alternative-mac': {
        'theme': 'amber',
        'badge': 'CLIPBOARD HISTORY BATTLE',
        'title': 'Best Paste Alternatives for Mac',
        'highlight': 'Lifetime One-Time Purchase',
        'desc': 'Ditch annual subscriptions for clean, native clipboard managers.',
        'app_slugs': ['clippio', 'maclip', 'tucket'],
        'layout': 'featured'
    },
    'best-screen-studio-alternative-mac': {
        'theme': 'rose',
        'badge': 'SCREEN RECORDER GUIDE',
        'title': 'Best Screen Studio Alternatives',
        'highlight': 'Auto-Zoom & Beautiful Demos',
        'desc': 'Record cinematic tutorials and promo clips with smooth mouse following.',
        'app_slugs': ['better-shot', 'screen-charm', 'screentoast', 'boom'],
        'layout': 'grid'
    },
    'best-cleanshot-x-alternative-mac': {
        'theme': 'cyan',
        'badge': 'SCREENSHOT & OCR HEAD-TO-HEAD',
        'title': 'Best CleanShot X Alternatives',
        'highlight': 'Instant Scrolling Capture & OCR',
        'desc': 'Free and lightweight Mac screen capture tools with built-in annotation.',
        'app_slugs': ['shottr', 'better-shot', 'dejashot'],
        'layout': 'featured'
    },
    'best-wispr-flow-alternative-mac': {
        'theme': 'indigo',
        'badge': 'VOICE DICTATION & AI',
        'title': 'Best Wispr Flow Alternatives',
        'highlight': 'Fast Local Speech-to-Text',
        'desc': 'Hold-to-talk voice typing powered by Whisper with zero subscription fees.',
        'app_slugs': ['macwhisper', 'holdspeak', 'precis', 'voicera'],
        'layout': 'grid'
    },
    'best-bartender-alternative-mac': {
        'theme': 'amber',
        'badge': 'MENU BAR ORGANIZERS',
        'title': 'Best Bartender Alternatives',
        'highlight': 'Clean Menu Bar & Notch Friendly',
        'desc': 'Hide clutter, reveal on hover, and group background menu items securely.',
        'app_slugs': ['clearbar', 'lounge', 'alcove'],
        'layout': 'featured'
    },
    'best-logseq-alternative-notes': {
        'theme': 'violet',
        'badge': 'OUTLINER & KNOWLEDGE BASE',
        'title': 'Best Logseq Alternatives for Mac',
        'highlight': 'Networked Bi-Directional Notes',
        'desc': 'Private, local-first note-taking with graph visualization and fast search.',
        'app_slugs': ['anytype', 'ia-writer'],
        'layout': 'featured'
    },
    'best-ulysses-alternative-writing': {
        'theme': 'rose',
        'badge': 'LONG-FORM WRITING SHOWDOWN',
        'title': 'Best Ulysses Alternatives for Mac',
        'highlight': 'Distraction-Free Markdown Studio',
        'desc': 'Write books, essays, and articles with one-time payment plain text editors.',
        'app_slugs': ['ia-writer', 'anytype'],
        'layout': 'featured'
    }
}

def generate_blog_thumbnail(slug, cfg):
    t_cfg = THEMES.get(cfg['theme'], THEMES['amber'])
    
    # 1. Base dark canvas
    img = Image.new('RGBA', (W, H), (11, 11, 14, 255))
    
    # 2. Ambient radial glow matching the guide's theme color
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gx, gy = W - 350 * SCALE, 200 * SCALE
    gr = int(600 * SCALE)
    r_col, g_col, b_col = t_cfg['glow']
    for r in range(gr, 0, -25):
        alpha = int(24 * (1 - r / gr))
        gdraw.ellipse([gx - r, gy - r, gx + r, gy + r], fill=(r_col, g_col, b_col, alpha))
    
    # Subtle secondary glow bottom left
    for r in range(int(450 * SCALE), 0, -25):
        alpha = int(14 * (1 - r / (450 * SCALE)))
        gdraw.ellipse([100 * SCALE - r, H - 100 * SCALE - r, 100 * SCALE + r, H - 100 * SCALE + r], fill=(120, 120, 140, alpha))
        
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)
    
    # 3. Left content area
    margin_x = 80 * SCALE
    curr_y = 65 * SCALE
    
    # Topic Badge / Category Pill
    badge_text = cfg['badge']
    bbox = f_tag.getbbox(badge_text)
    bw = (bbox[2] - bbox[0]) + 24 * SCALE
    bh = 34 * SCALE
    
    tag_bg = t_cfg['tag_bg']
    tag_txt = t_cfg['tag_txt']
    draw.rounded_rectangle([margin_x, curr_y, margin_x + bw, curr_y + bh], radius=17 * SCALE, fill=tag_bg, outline=(r_col, g_col, b_col, 160), width=int(1.5 * SCALE))
    draw.text((margin_x + 12 * SCALE, curr_y + 7 * SCALE), badge_text, font=f_tag, fill=tag_txt)
    
    curr_y += 65 * SCALE
    
    # Main Title
    title = cfg['title']
    f_title = f_title_lg if len(title) < 32 else f_title_md
    draw.text((margin_x, curr_y), title, font=f_title, fill=(255, 255, 255, 255))
    curr_y += 58 * SCALE if f_title == f_title_lg else 50 * SCALE
    
    # Highlight Line (Accent Color)
    highlight = cfg['highlight']
    draw.text((margin_x, curr_y), highlight, font=f_title, fill=t_cfg['accent'])
    curr_y += 70 * SCALE if f_title == f_title_lg else 62 * SCALE
    
    # Value Proposition / Subtitle
    desc = cfg['desc']
    # Wrap text if needed
    draw.text((margin_x, curr_y), desc, font=f_desc, fill=(161, 161, 170, 255))
    
    # Bottom brand signature
    draw.text((margin_x, H - 65 * SCALE), 'PickMacApps Editorial', font=f_brand, fill=(228, 228, 231, 255))
    draw.text((margin_x + 225 * SCALE, H - 65 * SCALE), '•   Tested on macOS Sequoia   •   pickmacapps.store', font=f_sub, fill=(113, 113, 122, 255))
    
    # 4. Right Visual Mockup (Floating Glass Dock with Real App Icons)
    dock_w = 410 * SCALE
    dock_h = 420 * SCALE
    dock_x = W - dock_w - 70 * SCALE
    dock_y = 100 * SCALE
    
    # Drop shadow behind glass panel
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle([dock_x, dock_y, dock_x + dock_w, dock_y + dock_h], radius=28 * SCALE, fill=(0, 0, 0, 175))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=24 * SCALE))
    img = Image.alpha_composite(img, shadow)
    draw = ImageDraw.Draw(img)
    
    # Glass panel
    glass = Image.new('RGBA', (dock_w, dock_h), (18, 18, 22, 225))
    gp_draw = ImageDraw.Draw(glass)
    gp_draw.rounded_rectangle([0, 0, dock_w, dock_h], radius=28 * SCALE, outline=(r_col, g_col, b_col, 80), width=int(1.5 * SCALE))
    
    # Traffic lights
    tl_y = 20 * SCALE
    gp_draw.ellipse([22 * SCALE, tl_y, 34 * SCALE, tl_y + 12 * SCALE], fill=(239, 68, 68, 240))
    gp_draw.ellipse([42 * SCALE, tl_y, 54 * SCALE, tl_y + 12 * SCALE], fill=(245, 158, 11, 240))
    gp_draw.ellipse([62 * SCALE, tl_y, 74 * SCALE, tl_y + 12 * SCALE], fill=(34, 197, 94, 240))
    
    f_panel_title = ImageFont.truetype(os.path.join(font_dir, 'segoeuib.ttf'), 14 * SCALE)
    gp_draw.text((95 * SCALE, tl_y - 2 * SCALE), 'Featured Candidates', font=f_panel_title, fill=(161, 161, 170, 230))
    
    img.paste(glass, (dock_x, dock_y), glass)
    draw = ImageDraw.Draw(img)
    
    # Icons inside dock
    slugs = cfg.get('app_slugs', [])
    layout = cfg.get('layout', 'featured')
    
    if layout == 'featured' and len(slugs) <= 3:
        # Vertical list with app name & rank
        row_h = 95 * SCALE
        start_y = dock_y + 60 * SCALE
        for idx, s in enumerate(slugs[:3]):
            app_data = apps_by_slug.get(s, None)
            app_name = app_data['name'] if app_data else s.replace('-', ' ').title()
            icon_p = get_icon_path(s)
            ry = start_y + idx * row_h
            
            # Row container card
            draw.rounded_rectangle([dock_x + 20 * SCALE, ry, dock_x + dock_w - 20 * SCALE, ry + 80 * SCALE], radius=16 * SCALE, fill=(26, 26, 32, 210), outline=(45, 45, 55, 200), width=int(1 * SCALE))
            
            # App icon
            rnd = make_rounded_icon(icon_p, 56 * SCALE, 14 * SCALE)
            if rnd:
                img.paste(rnd, (dock_x + 35 * SCALE, ry + 12 * SCALE), rnd)
            
            # Rank number pill
            rank_bg = (245, 158, 11) if idx == 0 else (70, 70, 80)
            draw.ellipse([dock_x + dock_w - 55 * SCALE, ry + 25 * SCALE, dock_x + dock_w - 25 * SCALE, ry + 55 * SCALE], fill=rank_bg)
            draw.text((dock_x + dock_w - 44 * SCALE, ry + 29 * SCALE), str(idx + 1), font=f_appName, fill=(255, 255, 255, 255))
            
            # App Name
            draw.text((dock_x + 105 * SCALE, ry + 18 * SCALE), app_name, font=f_appName, fill=(250, 250, 250, 255))
            tier_lbl = 'Top Recommendation' if idx == 0 else 'Alternative'
            draw.text((dock_x + 105 * SCALE, ry + 44 * SCALE), tier_lbl, font=f_sub, fill=(140, 140, 150, 255))
            
    else:
        # 2x2 or 2x3 grid
        icon_size = 76 * SCALE
        spacing_x = 34 * SCALE
        spacing_y = 30 * SCALE
        grid_start_x = dock_x + 32 * SCALE
        grid_start_y = dock_y + 60 * SCALE
        cols = 3 if len(slugs) >= 6 else 2
        
        for idx, s in enumerate(slugs[:6]):
            r_idx = idx // cols
            c_idx = idx % cols
            ix = grid_start_x + c_idx * (icon_size + spacing_x)
            iy = grid_start_y + r_idx * (icon_size + spacing_y + 24 * SCALE)
            
            icon_p = get_icon_path(s)
            rnd = make_rounded_icon(icon_p, icon_size, 18 * SCALE)
            if rnd:
                # Icon shadow
                is_img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
                is_draw = ImageDraw.Draw(is_img)
                is_draw.rounded_rectangle([ix + 2 * SCALE, iy + 4 * SCALE, ix + icon_size + 2 * SCALE, iy + icon_size + 4 * SCALE], radius=18 * SCALE, fill=(0, 0, 0, 120))
                is_img = is_img.filter(ImageFilter.GaussianBlur(radius=6 * SCALE))
                img = Image.alpha_composite(img, is_img)
                img.paste(rnd, (ix, iy), rnd)
            
            app_data = apps_by_slug.get(s, None)
            app_name = app_data['name'] if app_data else s.replace('-', ' ').title()
            if len(app_name) > 10:
                app_name = app_name[:9] + '…'
            draw = ImageDraw.Draw(img)
            draw.text((ix + 4 * SCALE, iy + icon_size + 8 * SCALE), app_name, font=f_appName, fill=(200, 200, 210, 255))
    
    # Downsample with Lanczos to 1200x630
    final_img = img.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS).convert('RGB')
    out_path = os.path.join('public', 'guides', f'{slug}.jpg')
    final_img.save(out_path, quality=92, optimize=True)
    print(f'Generated {out_path} ({os.path.getsize(out_path)} bytes)')

# Run generation for all 15 guides
for p in catalog['posts']:
    slug = p['slug']
    cfg = GUIDE_CONFIG.get(slug, {
        'theme': 'cyan',
        'badge': 'MAC APP GUIDE (2026)',
        'title': p['title'],
        'highlight': 'Tested & Verified Shelf',
        'desc': p['excerpt'],
        'app_slugs': ['shottr', 'clearbar', 'lounge', 'mole'],
        'layout': 'featured'
    })
    generate_blog_thumbnail(slug, cfg)

print('All 15 blog thumbnails successfully created!')
