#!/usr/bin/env python3
"""Generate Android launcher icon resources from the two supplied logos.

Usage: python3 -I make-app-icons.py <willow.png> <trip.png> <out_res_dir>

Each logo is red (#EA1C24) with white lettering. The lettering is extracted
into a transparent layer and scaled to sit inside Android's adaptive-icon
safe zone (a 66dp circle on a 108dp canvas), so no launcher mask crops it.

Output (names are deliberately unique so they never clash with Capacitor's
default resources):
  mipmap-*dpi/ic_<name>_fg.png     adaptive foreground (108dp canvas)
  mipmap-*dpi/ic_<name>.png        legacy rounded-square icon (API 24-25)
  mipmap-*dpi/ic_<name>_round.png  legacy round icon (API 24-25)
  mipmap-anydpi-v26/ic_<name>.xml and ic_<name>_round.xml  adaptive icons
  values/alibag_icon_colors.xml    background colour
"""
import math
import os
import sys

from PIL import Image, ImageDraw

RED = (234, 28, 36)
RED_HEX = "#EA1C24"
SAFE_DIAG = 0.60  # text bbox diagonal as a fraction of the 108dp canvas (safe zone is 0.611)

ADAPTIVE_PX = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
LEGACY_PX = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}


def lettering_layer(path):
    """Return an RGBA image: white lettering on transparent, cropped to its bbox."""
    im = Image.open(path).convert("RGB")
    # Pixels blend from red (G=28) to white (G=255); use green to recover coverage.
    g = im.split()[1]
    lo = RED[1]
    alpha = g.point(lambda v: max(0, min(255, round((v - lo) * 255 / (255 - lo)))))
    layer = Image.new("RGBA", im.size, (255, 255, 255, 0))
    layer.putalpha(alpha)
    return layer.crop(alpha.getbbox())


def fit_text(layer, canvas, diag_frac):
    """Scale lettering so its bbox diagonal = diag_frac * canvas; centre it."""
    w, h = layer.size
    scale = diag_frac * canvas / math.hypot(w, h)
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    scaled = layer.resize((nw, nh), Image.LANCZOS)
    out = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    out.alpha_composite(scaled, ((canvas - nw) // 2, (canvas - nh) // 2))
    return out


def width_fit_text(layer, canvas, width_frac):
    w, h = layer.size
    scale = width_frac * canvas / w
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    scaled = layer.resize((nw, nh), Image.LANCZOS)
    out = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    out.alpha_composite(scaled, ((canvas - nw) // 2, (canvas - nh) // 2))
    return out


def legacy_icon(layer, size, round_shape):
    ss = size * 4  # supersample for smooth edges
    base = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    mask = Image.new("L", (ss, ss), 0)
    d = ImageDraw.Draw(mask)
    if round_shape:
        d.ellipse((0, 0, ss - 1, ss - 1), fill=255)
        text = fit_text(layer, ss, 0.84)
    else:
        d.rounded_rectangle((0, 0, ss - 1, ss - 1), radius=int(ss * 0.18), fill=255)
        text = width_fit_text(layer, ss, 0.80)
    red = Image.new("RGBA", (ss, ss), RED + (255,))
    base.paste(red, (0, 0), mask)
    base.alpha_composite(text)
    return base.resize((size, size), Image.LANCZOS)


def write_icon_set(name, logo_path, res):
    layer = lettering_layer(logo_path)
    for dens, px in ADAPTIVE_PX.items():
        d = os.path.join(res, f"mipmap-{dens}")
        os.makedirs(d, exist_ok=True)
        fit_text(layer, px, SAFE_DIAG).save(os.path.join(d, f"ic_{name}_fg.png"), optimize=True)
    for dens, px in LEGACY_PX.items():
        d = os.path.join(res, f"mipmap-{dens}")
        os.makedirs(d, exist_ok=True)
        legacy_icon(layer, px, False).save(os.path.join(d, f"ic_{name}.png"), optimize=True)
        legacy_icon(layer, px, True).save(os.path.join(d, f"ic_{name}_round.png"), optimize=True)
    v26 = os.path.join(res, "mipmap-anydpi-v26")
    os.makedirs(v26, exist_ok=True)
    xml = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/alibag_icon_red" />\n'
        f'    <foreground android:drawable="@mipmap/ic_{name}_fg" />\n'
        "</adaptive-icon>\n"
    )
    for suffix in ("", "_round"):
        with open(os.path.join(v26, f"ic_{name}{suffix}.xml"), "w") as f:
            f.write(xml)


def main():
    willow, trip, res = sys.argv[1:4]
    write_icon_set("willow", willow, res)
    write_icon_set("trip", trip, res)
    vals = os.path.join(res, "values")
    os.makedirs(vals, exist_ok=True)
    with open(os.path.join(vals, "alibag_icon_colors.xml"), "w") as f:
        f.write(
            '<?xml version="1.0" encoding="utf-8"?>\n'
            f'<resources><color name="alibag_icon_red">{RED_HEX}</color></resources>\n'
        )


if __name__ == "__main__":
    main()
