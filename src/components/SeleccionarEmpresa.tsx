import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import api from "../services/api";

interface Empresa {
  id: number;
  nombre: string;
  nit: string;
  descripcion: string;
  activo: number;
}

export default function SeleccionarEmpresa() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarEmpresas = async () => {
      try {
        // Consumimos el endpoint que probamos en Postman
        const res = await api.get("/api/admin/empresas");
        // Mostramos solo las empresas activas
        setEmpresas(res.data.filter((e: Empresa) => e.activo === 1));
      } catch (error) {
        console.error("Error al cargar empresas:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarEmpresas();
  }, []);

  const handleSeleccionar = (empresa: Empresa) => {
    // Guardamos la elección en localStorage para el interceptor de api.ts
    localStorage.setItem("empresa_seleccionada_id", empresa.id.toString());
    localStorage.setItem("empresa_seleccionada_nombre", empresa.nombre);

    // Al ser superadmin, te mandamos al admin dashboard de esa empresa
    navigate("/admin");
  };

  if (loading) {
    return (
      <div
        className="flex flex-column align-items-center justify-content-center vh-100"
        style={{ height: "100vh" }}
      >
        <ProgressSpinner />
        <p className="mt-3">Cargando empresas disponibles...</p>
      </div>
    );
  }

  return (
    <div
      className="surface-ground px-4 py-8 md:px-6 lg:px-8"
      style={{ minHeight: "100vh" }}
    >
      <div className="text-center mb-6">
        <div className="text-900 text-5xl font-bold mb-3">
          Panel de SuperAdmin
        </div>
        <p className="text-700 text-2xl">
          Selecciona una empresa para gestionar su inventario
        </p>
      </div>

      <div className="grid justify-content-center">
        {empresas.map((empresa) => (
          <div key={empresa.id} className="col-12 md:col-6 lg:col-4 p-3 flex">
            <Card
              className="shadow-3 hover:shadow-6 transition-duration-200 border-round-xl border-top-3 border-blue-500 flex flex-column w-full"
              style={{ display: "flex", flexDirection: "column" }}
            >
              {/* Contenedor Superior */}
              <div className="flex-grow-1">
                <div className="flex align-items-center justify-content-between mb-3">
                  <span className="text-xl font-bold text-900">
                    {empresa.nombre}
                  </span>
                  <i className="pi pi-building text-blue-500 text-2xl"></i>
                </div>

                <div className="text-600 mb-4">
                  <div className="mb-2">
                    <span className="font-semibold">NIT:</span> {empresa.nit}
                  </div>
                  <div
                    className="line-height-3 italic"
                    style={{ minHeight: "3rem" }}
                  >
                    {empresa.descripcion || "Sin descripción detallada."}
                  </div>
                </div>
              </div>

              {/* Botón siempre al final */}
              <div className="mt-auto">
                <Button
                  label="Entrar a Gestión"
                  icon="pi pi-sign-in"
                  className="w-full p-button-outlined"
                  onClick={() => handleSeleccionar(empresa)}
                />
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
