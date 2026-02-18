#!/usr/bin/env python3
"""
Generate fidget spinner icons for the "Fidget!" Chrome extension.
Produces 16x16, 48x48, and 128x128 PNG icons with transparent backgrounds.
"""

import math
import shutil
from PIL import Image, ImageDraw, ImageFilter

# Colors
CYAN_LOBE = (72, 219, 251)       # #48dbfb
DARK_BODY = (30, 48, 80)         # #1e3050
YELLOW_CENTER = (254, 202, 87)   # #feca57
OUTLINE_COLOR = (16, 33, 62)     # #16213e
SHADOW_COLOR = (0, 0, 0, 60)
GLOW_CYAN = (72, 219, 251, 40)

# Tilt angle in degrees (dynamic look)
TILT_DEG = 15.0


def draw_spinner(size: int) -> Image.Image:
    """Draw a fidget spinner icon at the given size."""
    # Work at higher resolution for antialiasing, then downscale
    supersample = 4
    s = size * supersample
    center = s / 2

    # --- Proportions relative to canvas size ---
    lobe_radius = s * 0.18          # radius of each lobe circle
    arm_length = s * 0.30           # distance from center to each lobe center
    center_radius = s * 0.12        # center bearing outer radius
    center_inner = s * 0.07         # center bearing inner circle
    arm_width = s * 0.14            # thickness of connecting arms
    outline_w = max(1, s * 0.018)   # outline stroke width

    # For very small icons (16px), make proportions bolder
    if size <= 16:
        lobe_radius = s * 0.20
        arm_length = s * 0.28
        center_radius = s * 0.14
        center_inner = s * 0.08
        arm_width = s * 0.18
        outline_w = max(2, s * 0.03)

    # Create images
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    shadow_img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_shadow = ImageDraw.Draw(shadow_img)

    # Compute lobe positions at 120 degree intervals, with tilt
    tilt_rad = math.radians(TILT_DEG)
    lobe_angles = [tilt_rad + math.radians(a) for a in [0, 120, 240]]
    lobe_centers = []
    for angle in lobe_angles:
        lx = center + arm_length * math.cos(angle)
        ly = center + arm_length * math.sin(angle)
        lobe_centers.append((lx, ly))

    # --- Helper to draw a filled circle ---
    def circle_bbox(cx, cy, r):
        return [cx - r, cy - r, cx + r, cy + r]

    # --- Draw shadow layer ---
    shadow_offset = s * 0.015
    for lx, ly in lobe_centers:
        draw_shadow.ellipse(
            circle_bbox(lx + shadow_offset, ly + shadow_offset, lobe_radius),
            fill=SHADOW_COLOR,
        )
        # Shadow for arms: draw a thick line
        draw_shadow.line(
            [(center + shadow_offset, center + shadow_offset),
             (lx + shadow_offset, ly + shadow_offset)],
            fill=SHADOW_COLOR,
            width=int(arm_width),
        )
    draw_shadow.ellipse(
        circle_bbox(center + shadow_offset, center + shadow_offset, center_radius),
        fill=SHADOW_COLOR,
    )
    # Blur the shadow
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(radius=s * 0.025))

    # Composite shadow under main image
    base = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    base = Image.alpha_composite(base, shadow_img)

    # --- Draw arms (connecting body) with outlines ---
    # Draw outline arms first (slightly wider), then body arms on top
    for lx, ly in lobe_centers:
        # Outline
        draw.line(
            [(center, center), (lx, ly)],
            fill=OUTLINE_COLOR + (255,),
            width=int(arm_width + outline_w * 2),
        )
    for lx, ly in lobe_centers:
        # Body
        draw.line(
            [(center, center), (lx, ly)],
            fill=DARK_BODY + (255,),
            width=int(arm_width),
        )

    # Round the arm ends by drawing circles at center and at each joint
    draw.ellipse(
        circle_bbox(center, center, arm_width / 2),
        fill=DARK_BODY + (255,),
        outline=OUTLINE_COLOR + (255,),
        width=int(outline_w),
    )

    # --- Draw lobes with outlines ---
    for lx, ly in lobe_centers:
        # Outline circle (slightly larger)
        draw.ellipse(
            circle_bbox(lx, ly, lobe_radius + outline_w),
            fill=OUTLINE_COLOR + (255,),
        )
        # Main lobe
        draw.ellipse(
            circle_bbox(lx, ly, lobe_radius),
            fill=CYAN_LOBE + (255,),
        )
        # Highlight / shine on each lobe (small lighter circle, upper-left)
        highlight_r = lobe_radius * 0.35
        hx = lx - lobe_radius * 0.25
        hy = ly - lobe_radius * 0.30
        highlight_color = (160, 235, 255, 100)
        draw.ellipse(
            circle_bbox(hx, hy, highlight_r),
            fill=highlight_color,
        )
        # Small inner detail circle (bearing in lobe)
        inner_r = lobe_radius * 0.30
        draw.ellipse(
            circle_bbox(lx, ly, inner_r),
            fill=DARK_BODY + (200,),
        )

    # --- Draw center bearing ---
    # Outer ring outline
    draw.ellipse(
        circle_bbox(center, center, center_radius + outline_w),
        fill=OUTLINE_COLOR + (255,),
    )
    # Outer ring
    draw.ellipse(
        circle_bbox(center, center, center_radius),
        fill=YELLOW_CENTER + (255,),
    )
    # Inner circle outline
    draw.ellipse(
        circle_bbox(center, center, center_inner + outline_w * 0.5),
        fill=OUTLINE_COLOR + (255,),
    )
    # Inner circle
    draw.ellipse(
        circle_bbox(center, center, center_inner),
        fill=(255, 225, 140, 255),
    )
    # Tiny highlight on center bearing
    ch_r = center_inner * 0.35
    draw.ellipse(
        circle_bbox(center - center_inner * 0.2, center - center_inner * 0.25, ch_r),
        fill=(255, 255, 230, 140),
    )

    # --- Add subtle glow around the spinner ---
    glow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    for lx, ly in lobe_centers:
        glow_draw.ellipse(
            circle_bbox(lx, ly, lobe_radius * 1.4),
            fill=GLOW_CYAN,
        )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=s * 0.04))

    # --- Composite all layers ---
    base = Image.alpha_composite(base, glow)
    base = Image.alpha_composite(base, img)

    # Downscale with high-quality resampling
    result = base.resize((size, size), Image.LANCZOS)
    return result


def main():
    sizes = [16, 48, 128]
    output_dir = "/Users/geoecho/projects/fidget/icons"

    for sz in sizes:
        icon = draw_spinner(sz)
        path = f"{output_dir}/icon{sz}.png"
        icon.save(path, "PNG")
        print(f"Saved {path} ({sz}x{sz})")

    # Copy 128x128 to store directory
    src = f"{output_dir}/icon128.png"
    dst = "/Users/geoecho/projects/fidget/store/icon128.png"
    shutil.copy2(src, dst)
    print(f"Copied to {dst}")

    print("Done! All icons generated.")


if __name__ == "__main__":
    main()
