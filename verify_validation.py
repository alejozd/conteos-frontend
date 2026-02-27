
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

        # Login
        await page.goto("http://localhost:5173/captura?grupo=1")
        await page.evaluate("""
            localStorage.setItem('user', JSON.stringify({id: 2, username: 'operario', rol: 'operario'}));
            localStorage.setItem('token', 'fake-token');
        """)
        await page.goto("http://localhost:5173/captura?grupo=1")

        await page.wait_for_selector(".p-card")

        # 1. Verificar botón deshabilitado inicialmente
        button = page.locator('button:has-text("GUARDAR CONTEO")')
        is_disabled = await button.is_disabled()
        print(f"Button disabled initially: {is_disabled}")

        # 2. Llenar producto
        await page.fill('input[placeholder="Referencia o nombre..."]', "lavamanos")
        await page.wait_for_selector(".p-autocomplete-item")
        await page.click(".p-autocomplete-item")

        is_disabled = await button.is_disabled()
        print(f"Button disabled after product selection: {is_disabled}")

        # 3. Llenar cantidad
        await page.fill('input[placeholder="0"]', "5")

        is_disabled = await button.is_disabled()
        print(f"Button disabled after quantity (bodega/ubicacion should be auto-selected if single): {is_disabled}")

        # Si el botón sigue deshabilitado, verificar por qué
        if is_disabled:
            # Forzar selección de bodega/ubicación por si acaso no se auto-seleccionaron en el mock
            await page.click(".p-dropdown:first-of-type") # Bodega
            await page.click(".p-dropdown-item:first-of-type")
            await page.click(".p-dropdown:last-of-type") # Ubicacion
            await page.click(".p-dropdown-item:first-of-type")

            is_disabled = await button.is_disabled()
            print(f"Button disabled after explicit selection: {is_disabled}")

        await page.screenshot(path="validation_test.png")
        print("Screenshot saved as validation_test.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
