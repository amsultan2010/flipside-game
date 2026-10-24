# Renders brand/icon.svg and public/favicon.svg into the PNG and ICO files in public/.
# Needs Python with Playwright (Chromium) and Pillow. Only rerun this after changing the SVGs.
import asyncio, io, pathlib
from PIL import Image
from playwright.async_api import async_playwright

root = pathlib.Path(__file__).resolve().parent.parent
pub = root / 'public'

async def render(svg_path, size, transparent):
    svg = svg_path.read_text()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': size, 'height': size})
        await pg.set_content(f'<html><body style="margin:0;background:transparent">{svg.replace("<svg ", f"<svg width=\"{size}\" height=\"{size}\" ", 1)}</body></html>')
        png = await pg.screenshot(omit_background=transparent, clip={'x': 0, 'y': 0, 'width': size, 'height': size})
        await b.close()
    return Image.open(io.BytesIO(png)).convert('RGBA')

async def main():
    icon, fav = root / 'brand/icon.svg', pub / 'favicon.svg'
    for name, size in [('apple-touch-icon.png', 180), ('icon-192.png', 192), ('icon-512.png', 512)]:
        (await render(icon, size, False)).convert('RGB').save(pub / name, optimize=True)
    big = await render(fav, 256, True)
    big.save(pub / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    (await render(fav, 32, True)).save(pub / 'favicon-32.png', optimize=True)
    print('icons written to', pub)

asyncio.run(main())
