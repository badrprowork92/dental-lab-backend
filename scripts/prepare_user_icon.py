from pathlib import Path

from PIL import Image

source = Path("/home/ubuntu/webdev-static-assets/dental-lab-user-icon.png")
target_dir = Path("/home/ubuntu/dental-lab-accounting/assets/images")
target_dir.mkdir(parents=True, exist_ok=True)

with Image.open(source) as image:
    prepared = image.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS)
    for name in ("icon.png", "splash-icon.png", "favicon.png", "android-icon-foreground.png"):
        prepared.save(target_dir / name, format="PNG", optimize=True, compress_level=9)
