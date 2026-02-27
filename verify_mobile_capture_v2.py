
import asyncio
from playwright.async_api import async_playwright
import json

async def run():
    async with async_playwright() as p:
        # Use mobile viewport
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 412, 'height': 915}, is_mobile=True)
        page = await context.new_page()

        # Mock API responses
        await page.route("**/api/conteos/grupos/activos", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([{"id": 1, "fecha": "2025-12-12", "descripcion": "Conteo Diciembre 2025", "activo": 1}])
        ))

        await page.route("**/api/asignacion/mis-bodegas", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([{"id": 1, "nombre": "MALLA"}])
        ))

        await page.route("**/api/asignacion/mis-ubicaciones?bodegaId=1", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([{"id": 1, "nombre": "MA-04"}])
        ))

        await page.route("**/api/productos/buscar?texto=lavamanos", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([{"id": 101, "nombre": "D LAVAMANOS MARSELLA BLANCO", "referencia": "023011001", "saldo_sistema": 10}])
        ))

        # Inyectar localStorage
        await page.goto("http://localhost:5173/captura?grupo=1")
        await page.evaluate("""
            localStorage.setItem('user', JSON.stringify({id: 2, username: 'operario', rol: 'operario'}));
            localStorage.setItem('token', 'fake-token');
        """)
        await page.goto("http://localhost:5173/captura?grupo=1")

        # Wait for content
        await page.wait_for_selector(".p-card")

        # Simular búsqueda y selección de producto para ver el layout completo
        await page.fill('input[placeholder="Referencia o nombre..."]', "lavamanos")
        await page.wait_for_selector(".p-autocomplete-item")
        await page.click(".p-autocomplete-item")

        # Esperar que aparezca el cuadro del producto
        await page.wait_for_selector(".pi-tag")

        await asyncio.sleep(1)

        await page.screenshot(path="mobile_capture_v2.png")
        print("Screenshot saved as mobile_capture_v2.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
