// src/components/ConteoOperario.tsx
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Card } from "primereact/card";
import { InputNumber } from "primereact/inputnumber";
import {
  AutoComplete,
  type AutoCompleteChangeEvent,
  type AutoCompleteSelectEvent,
  type AutoCompleteCompleteEvent,
} from "primereact/autocomplete";
import { Dropdown, type DropdownChangeEvent } from "primereact/dropdown";
import axios from "axios";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";

// TIPOS ============================
interface Producto {
  id: string | number;
  nombre: string;
  referencia: string;
  saldo_sistema: string | number;
}

interface Ubicacion {
  id: number;
  nombre: string;
}

interface Bodega {
  id: number;
  nombre: string;
}

export default function ConteoOperario() {
  const { grupoActivo, setGrupoActivo, logout } = useAuth();
  const toast = useRef<Toast>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const grupoId = params.get("grupo");

  // ESTADOS =========================
  const [textoBusqueda, setTextoBusqueda] = useState<string>("");
  const [resultadosProductos, setResultadosProductos] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<Ubicacion | null>(null);
  const [cantidad, setCantidad] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<Bodega | null>(null);

  // 0. Recuperar grupoActivo
  useEffect(() => {
    if (grupoActivo || !grupoId) return;

    const fetchGrupoById = async () => {
      try {
        const res = await api.get("/api/conteos/grupos/activos");
        const grupos = Array.isArray(res.data) ? res.data : [];
        const g = grupos.find((x: any) => String(x.id) === String(grupoId));
        if (g) setGrupoActivo(g);
      } catch (error) {
        console.error("Error recuperando grupo:", error);
      }
    };
    fetchGrupoById();
  }, [grupoId, grupoActivo, setGrupoActivo]);

  // 1. Cargar bodegas
  useEffect(() => {
    const fetchBodegas = async () => {
      try {
        const res = await api.get("/api/asignacion/mis-bodegas");
        const data = res.data || [];
        setBodegas(data);
        if (data.length === 1) setBodegaSeleccionada(data[0]);
      } catch {
        toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudieron cargar bodegas" });
      }
    };
    fetchBodegas();
  }, []);

  // 2. Cargar ubicaciones cuando cambia bodega
  useEffect(() => {
    if (!bodegaSeleccionada) {
      setUbicaciones([]);
      setUbicacionSeleccionada(null);
      return;
    }

    const fetchUbicaciones = async () => {
      try {
        const res = await api.get(`/api/asignacion/mis-ubicaciones?bodegaId=${bodegaSeleccionada.id}`);
        const data = res.data || [];
        setUbicaciones(data);
        if (data.length === 1) setUbicacionSeleccionada(data[0]);
      } catch (error) {
        console.error("Error cargando ubicaciones:", error);
      }
    };
    fetchUbicaciones();
  }, [bodegaSeleccionada]);

  const buscarProductos = async (e: AutoCompleteCompleteEvent) => {
    const q = (e.query ?? "").trim();
    if (q.length < 2) return;
    try {
      const res = await api.get(`/api/productos/buscar?texto=${encodeURIComponent(q)}`);
      setResultadosProductos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const guardar = async () => {
    if (!productoSeleccionado || !bodegaSeleccionada || !ubicacionSeleccionada || !cantidad || cantidad <= 0) return;

    try {
      setLoading(true);
      await api.post("/api/conteos/guardar", {
        id: productoSeleccionado.id,
        ubicacion_id: ubicacionSeleccionada.id,
        cantidad,
        conteo_grupo_id: Number(grupoId),
      });

      toast.current?.show({ severity: "success", summary: "Guardado", detail: "Conteo registrado" });
      setProductoSeleccionado(null);
      setCantidad(null);
      setUbicacionSeleccionada(null);
      setTextoBusqueda("");
    } catch (error) {
      let msg = "No se pudo guardar";
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        navigate("/post-login");
        return;
      }
      toast.current?.show({ severity: "error", summary: "Error", detail: msg });
    } finally {
      setLoading(false);
    }
  };

  const confirmarGuardado = () => {
    if (!productoSeleccionado || !bodegaSeleccionada || !ubicacionSeleccionada || !cantidad || cantidad <= 0) {
      toast.current?.show({ severity: "warn", summary: "Datos incompletos", detail: "Completa todos los campos" });
      return;
    }

    confirmDialog({
      header: "Confirmar conteo",
      message: (
        <div className="flex flex-col gap-2 py-2">
          <p><strong>Producto:</strong> {productoSeleccionado.nombre}</p>
          <p><strong>Referencia:</strong> {productoSeleccionado.referencia}</p>
          <p><strong>Ubicación:</strong> {bodegaSeleccionada.nombre} - {ubicacionSeleccionada.nombre}</p>
          <p className="text-xl mt-2"><strong>Cantidad:</strong> <span className="text-blue-500 font-bold">{cantidad}</span></p>
        </div>
      ),
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Confirmar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-success",
      accept: guardar,
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center p-4">
      <ConfirmDialog />
      <Toast ref={toast} />

      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <ProgressSpinner />
          <p className="text-white mt-4 font-bold">Guardando conteo...</p>
        </div>
      )}

      <div className="w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <i className="pi pi-box text-blue-500 text-3xl"></i>
             <h1 className="text-2xl font-bold text-white m-0">Captura</h1>
          </div>
          <Button icon="pi pi-sign-out" label="Salir" text severity="danger" onClick={() => { logout(); navigate("/login"); }} />
        </div>

        <Card className="bg-gray-900 border-gray-800 text-white shadow-xl rounded-2xl">
          <div className="mb-6 border-b border-gray-800 pb-4">
             <h2 className="text-2xl font-bold text-white m-0">Conteo: {grupoActivo?.descripcion || "..."}</h2>
             <p className="text-gray-400 text-sm mt-2 flex items-center gap-2">
                <span className="font-semibold">Fecha:</span> {grupoActivo?.fecha || "..."}
             </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-200">Buscar producto</label>
              <AutoComplete
                value={textoBusqueda}
                suggestions={resultadosProductos}
                completeMethod={buscarProductos}
                dropdown
                field="nombre"
                placeholder="Escribe referencia o nombre..."
                className="w-full"
                inputClassName="w-full bg-gray-800 border-gray-700 text-white p-4 text-lg"
                panelClassName="bg-gray-800 border-gray-700 text-white"
                onChange={(e: AutoCompleteChangeEvent) => setTextoBusqueda(e.value)}
                onSelect={(e: AutoCompleteSelectEvent) => {
                  setProductoSeleccionado(e.value);
                  setTextoBusqueda(e.value.nombre);
                }}
                itemTemplate={(item: Producto) => (
                  <div className="flex flex-col p-1">
                    <span className="font-bold text-blue-400">{item.nombre}</span>
                    <small className="text-gray-400">{item.referencia}</small>
                  </div>
                )}
              />
            </div>

            {productoSeleccionado && (
              <div className="bg-gray-800/40 border border-gray-700 p-4 rounded-xl">
                 <div className="flex items-center gap-3 mb-1">
                    <i className="pi pi-tag text-blue-500"></i>
                    <p className="m-0 text-blue-400 font-bold text-lg">{productoSeleccionado.nombre}</p>
                 </div>
                 <p className="m-0 text-gray-500 text-sm ml-7">Ref: {productoSeleccionado.referencia}</p>
              </div>
            )}

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-200">Bodega</label>
                <Dropdown
                  value={bodegaSeleccionada}
                  options={bodegas}
                  optionLabel="nombre"
                  placeholder="Selecciona bodega"
                  className="w-full bg-gray-800 border-gray-700 text-white h-14 flex items-center"
                  onChange={(e: DropdownChangeEvent) => setBodegaSeleccionada(e.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-200">Ubicación</label>
                <Dropdown
                  value={ubicacionSeleccionada}
                  options={ubicaciones}
                  optionLabel="nombre"
                  placeholder={bodegaSeleccionada ? "Selecciona ubicación" : "Primero selecciona una bodega"}
                  disabled={!bodegaSeleccionada}
                  className="w-full bg-gray-800 border-gray-700 text-white h-14 flex items-center"
                  onChange={(e: DropdownChangeEvent) => setUbicacionSeleccionada(e.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-200">Cantidad</label>
              <InputNumber
                value={cantidad}
                onValueChange={(e) => setCantidad(e.value ?? null)}
                placeholder="0"
                className="w-full"
                inputClassName="w-full bg-gray-800 border-gray-700 text-white text-3xl font-bold p-4 h-16"
                min={0}
                minFractionDigits={0}
                maxFractionDigits={5}
                useGrouping={false}
              />
            </div>

            <Button
              label="Guardar conteo"
              icon="pi pi-check"
              className="w-full py-5 text-xl font-bold shadow-lg shadow-blue-900/20 mt-4"
              onClick={confirmarGuardado}
              loading={loading}
              disabled={loading}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
