from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / "src" / "assets" / "social"
for stem in ("instagram", "linkedin"):
    source = root / f"{stem}@2x.png"
    target = root / f"{stem}-white@2x.png"
    image = Image.open(source).convert("RGBA")
    alpha = image.getchannel("A")
    white = Image.new("RGBA", image.size, (255, 255, 255, 0))
    white.putalpha(alpha)
    white.save(target, optimize=True)
    print(target)
