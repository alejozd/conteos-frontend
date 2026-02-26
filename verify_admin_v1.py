
import asyncio
from playwright.async_api import async_playwright
import json

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # Desktop view for admin dashboard
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # Mock API responses
        await page.route("**/api/admin/conteos-grupos", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([
                {"id": 1, "fecha": "2025-01-01", "descripcion": "Inventario Anual", "activo": 1},
                {"id": 2, "fecha": "2024-12-01", "descripcion": "Inventario Diciembre", "activo": 0}
            ])
        ))

        await page.route("**/api/admin/saldos-resumen**", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([
                {"id": 1, "nombre": "Producto A", "referencia": "REF001", "saldo_sistema": "100.00", "conteo_total": "95.00", "diferencia": "-5.00"},
                {"id": 2, "nombre": "Producto B", "referencia": "REF002", "saldo_sistema": "50.00", "conteo_total": "50.00", "diferencia": "0.00"},
                {"id": 3, "nombre": "Producto C", "referencia": "REF003", "saldo_sistema": "200.00", "conteo_total": "210.00", "diferencia": "10.00"}
            ])
        ))

        await page.route("**/api/admin/conteos-anulados**", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([])
        ))

        await page.route("**/api/admin/conteos-stats**", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({"total_registros": 45})
        ))

        # Inyectar localStorage para saltar login
        await page.goto("http://localhost:5173/admin")
        await page.evaluate("""
            localStorage.setItem('user', JSON.stringify({id: 1, username: 'admin', rol: 'admin'}));
            localStorage.setItem('token', 'fake-token');
        """)
        await page.goto("http://localhost:5173/admin")

        # Esperar a que cargue la tabla
        await page.wait_for_selector(".p-datatable")

        # Esperar un poco para animaciones
        await asyncio.sleep(1)

        await page.screenshot(path="admin_dashboard_v1.png", full_page=True)
        print("Screenshot saved as admin_dashboard_v1.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
