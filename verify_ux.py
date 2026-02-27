
import asyncio
from playwright.async_api import async_playwright
import json

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 412, 'height': 915}, is_mobile=True)
        page = await context.new_page()

        # Mock API responses
        await page.route("**/api/conteos/grupos/activos", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([{"id": 1, "fecha": "2025-12-12", "descripcion": "Conteo Diciembre 2025", "activo": 1}])
        ))

        # Login
        await page.goto("http://localhost:5173/captura?grupo=1")
        await page.evaluate("""
            localStorage.setItem('user', JSON.stringify({id: 2, username: 'operario', rol: 'operario'}));
            localStorage.setItem('token', 'fake-token');
        """)
        await page.goto("http://localhost:5173/captura?grupo=1")

        await page.wait_for_selector(".p-card")

        # 1. Verificar botón habilitado inicialmente
        button = page.locator('button:has-text("GUARDAR CONTEO")')
        is_disabled = await button.is_disabled()
        print(f"Button disabled initially: {is_disabled}")

        # 2. Clic en guardar sin llenar nada
        await button.click()

        # 3. Verificar que los campos marcados como inválidos (red border)
        # En PrimeReact, invalid agrega la clase p-invalid
        invalid_fields = page.locator(".p-invalid")
        count = await invalid_fields.count()
        print(f"Number of invalid fields after attempt: {count}")

        await page.screenshot(path="ux_validation_test.png")
        print("Screenshot saved as ux_validation_test.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
