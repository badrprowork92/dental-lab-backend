from pathlib import Path
from PIL import Image

source = Path("/home/ubuntu/upload/1000409445.jpg")
target_dir = Path("/home/ubuntu/dental-lab-accounting/assets/images")
target_dir.mkdir(parents=True, exist_ok=True)

with Image.open(source) as original:
    image = original.convert("RGB")
    canvas = Image.new("RGB", (512, 512), "#194F4A")
    image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    x = (512 - image.width) // 2
    y = (512 - image.height) // 2
    canvas.paste(image, (x, y))
    for filename in ("icon.png", "splash-icon.png", "favicon.png", "android-icon-foreground.png"):
        canvas.save(target_dir / filename, "PNG", optimize=True, compress_level=9)

print("Created compressed application logo assets.")
