from pathlib import Path
from PIL import Image

SRC = Path(r"C:\Users\Gemdelle\Downloads\05. Programming\LPS-twitch\src\assets\avatars\spadabeccia.png")
OUT_DIR = Path(r"C:\Users\Gemdelle\Downloads\05. Programming\LPS-twitch\public\avatars\spadabeccia")
FRAME_W = 128
FRAME_H = 128


def to_p_with_transparency(frame: Image.Image) -> Image.Image:
    frame = frame.convert("RGBA")
    alpha = frame.getchannel("A")
    rgb = Image.new("RGB", frame.size, (0, 0, 0))
    rgb.paste(frame, mask=alpha)
    pal = rgb.convert("P", palette=Image.ADAPTIVE, colors=255)
    transparent = 255
    mask = Image.eval(alpha, lambda a: 255 if a < 16 else 0)
    pal.paste(transparent, mask=mask)
    pal.info["transparency"] = transparent
    return pal


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    im = Image.open(SRC).convert("RGBA")
    cols = im.width // FRAME_W
    rows = im.height // FRAME_H
    print(f"grid {cols}x{rows} from {im.size}")

    written = 0
    for row in range(rows):
        frames = []
        opaque_pixels = 0
        for col in range(cols):
            box = (
                col * FRAME_W,
                row * FRAME_H,
                (col + 1) * FRAME_W,
                (row + 1) * FRAME_H,
            )
            crop = im.crop(box)
            opaque_pixels += sum(1 for a in crop.getchannel("A").getdata() if a > 16)
            frames.append(to_p_with_transparency(crop))

        if opaque_pixels < 40:
            print(f"skip empty row {row}")
            continue

        dest = OUT_DIR / f"row-{row:02d}.gif"
        frames[0].save(
            dest,
            save_all=True,
            append_images=frames[1:],
            duration=120,
            loop=0,
            disposal=2,
            transparency=255,
            optimize=False,
        )
        written += 1
        print(f"wrote {dest.name} opaque={opaque_pixels}")

    print(f"done {written} gifs")


if __name__ == "__main__":
    main()
