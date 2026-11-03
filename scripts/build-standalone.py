#!/usr/bin/env python3
"""Build Version A (The Monograph) as a standalone site in book/.

The output is one index.html with every style and script inlined, plus the photos
it uses. It has no links back to the other directions, so the folder can be hosted
anywhere on its own.  Run:  python3 scripts/build-standalone.py
"""
import re, shutil
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = root / "book"
SITE = "https://jdbeebe.github.io/midcenturyride/book/"  # used for share previews

TITLE = "Modern New Canaan · A ride through the houses"
DESC = ("26 mid-century modern houses on a 17.4-mile bike ride through New Canaan, CT. "
        "Hosted by Bill Adamsen and the Ridgefield Bicycle Club.")
SHARE_IMG = "assets/img/12-glass-house.jpg"
FAVICON = ("data:image/svg+xml," +
           "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E"
           "%3Crect width='64' height='64' rx='12' fill='%23CF5127'/%3E"
           "%3Ccircle cx='42' cy='22' r='12' fill='%23F3EEE3'/%3E"
           "%3Crect x='6' y='36' width='44' height='4' fill='%231C1B18'/%3E"
           "%3Cpath d='M12 40v14M22 40v14M32 40v14M42 40v14' stroke='%231C1B18' stroke-width='2'/%3E%3C/svg%3E")

src = (root / "directions/a-monograph/index.html").read_text()
read = lambda p: (root / p).read_text()

# Inline the shared stylesheet.
src = re.sub(r'<link rel="stylesheet" href="\.\./\.\./shared/flipbook\.css[^"]*">',
             lambda m: "<style>\n" + read("shared/flipbook.css") + "</style>", src)

# Inline every local script, in order.
def inline_script(m):
    path = m.group(1).split("?")[0]
    return "<script>\n" + read(path) + "</script>"
src = re.sub(r'<script src="\.\./\.\./([^"]+)"[^>]*></script>', inline_script, src)
src = src.replace("window.MCR_ROOT = '../../';", "window.MCR_ROOT = '';")

# Drop the link back to the direction chooser.
src = re.sub(r'\s*<a class="back" href="\.\./\.\./">[^<]*</a>', "", src)

# Title, description, share previews, favicon.
head = f"""<title>{TITLE}</title>
<meta name="description" content="{DESC}">
<meta name="theme-color" content="#2B2925">
<meta property="og:type" content="website">
<meta property="og:title" content="{TITLE}">
<meta property="og:description" content="{DESC}">
<meta property="og:url" content="{SITE}">
<meta property="og:image" content="{SITE}{SHARE_IMG}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{FAVICON}">"""
src = re.sub(r"<title>.*?</title>", lambda m: head, src, count=1)

assert "../../" not in src, "a relative path to the main site is left in the standalone build"

# Write the folder: page + only the photos the manifest references.
if out.exists():
    shutil.rmtree(out)
(out / "assets/img").mkdir(parents=True)
(out / "index.html").write_text(src)
used = set(re.findall(r'"src":\s*"assets/img/([^"]+)"', read("assets/img/manifest.js")))
for name in sorted(used):
    shutil.copy2(root / "assets/img" / name, out / "assets/img" / name)
shutil.copy2(root / "assets/img/credits.json", out / "assets/img/credits.json")

size = sum(f.stat().st_size for f in out.rglob("*") if f.is_file())
print(f"book/: index.html ({(out / 'index.html').stat().st_size // 1024} KB) + {len(used)} photos, {size // 1024} KB total")
