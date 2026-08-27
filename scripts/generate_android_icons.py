from pathlib import Path

from PIL import Image, ImageDraw


SOURCE = Path("public/icons/icon-512.png")
RESOURCES = Path("android/app/src/main/res")
LEGACY_SIZES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
FOREGROUND_SIZES = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}


source = Image.open(SOURCE).convert("RGBA")

for density, size in LEGACY_SIZES.items():
    destination = RESOURCES / f"mipmap-{density}"
    icon = source.resize((size, size), Image.Resampling.LANCZOS)
    icon.save(destination / "ic_launcher.png")

    round_mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(round_mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    round_icon = Image.new("RGBA", (size, size))
    round_icon.paste(icon, (0, 0), round_mask)
    round_icon.save(destination / "ic_launcher_round.png")

for density, size in FOREGROUND_SIZES.items():
    destination = RESOURCES / f"mipmap-{density}"
    source.resize((size, size), Image.Resampling.LANCZOS).save(
        destination / "ic_launcher_foreground.png"
    )
