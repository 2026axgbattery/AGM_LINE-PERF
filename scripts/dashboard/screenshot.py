"""output/mockups/p1~p5.html → PNG 캡처 (pip install playwright && playwright install chromium 필요)"""
from pathlib import Path
from playwright.sync_api import sync_playwright
MOCK = Path(__file__).resolve().parents[2] / "output" / "mockups"
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 400}, device_scale_factor=1.5)
    for n in range(1, 6):
        pg.goto((MOCK / f"p{n}.html").as_uri()); pg.wait_for_timeout(300)
        pg.screenshot(path=str(MOCK / f"p{n}.png"), full_page=True)
    b.close()
print("saved to", MOCK)
