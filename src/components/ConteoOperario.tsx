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
import "../styles/Capture.css";

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

interface ConteoGrupo {
  id: number;
  fecha: string;
  descripcion: string;
  activo: number;
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
  const [intentoSometido, setIntentoSometido] = useState(false);

  // 0. Recuperar grupoActivo
  useEffect(() => {
    if (grupoActivo || !grupoId) return;

    const fetchGrupoById = async () => {
      try {
        const res = await api.get("/api/conteos/grupos/activos");
        const grupos = (Array.isArray(res.data) ? res.data : []) as ConteoGrupo[];
        const g = grupos.find((x) => String(x.id) === String(grupoId));
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
      setIntentoSometido(false);
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
    setIntentoSometido(true);
    if (!productoSeleccionado || !bodegaSeleccionada || !ubicacionSeleccionada || !cantidad || cantidad <= 0) {
      toast.current?.show({ severity: "warn", summary: "Datos incompletos", detail: "Completa todos los campos" });
      return;
    }

    confirmDialog({
      header: "Confirmar conteo",
      message: (
        <div className="flex flex-column gap-2 py-2">
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
    <div className="capture-container flex flex-column align-items-center p-2">
      <ConfirmDialog />
      <Toast ref={toast} />

      {loading && (
        <div className="fixed top-0 left-0 w-full h-full z-5 flex flex-column align-items-center justify-content-center capture-loading-overlay">
          <ProgressSpinner />
          <p className="text-white mt-4 font-bold">Guardando conteo...</p>
        </div>
      )}

      <div className="capture-content">
        <div className="flex justify-content-between align-items-center mb-2">
          <div className="flex align-items-center gap-2">
             <i className="pi pi-box text-blue-500 text-3xl"></i>
             <span className="text-2xl font-bold text-white uppercase tracking-tight">Captura</span>
          </div>
          <Button icon="pi pi-sign-out" label="Salir" text severity="danger" onClick={() => { logout(); navigate("/login"); }} />
        </div>

        <Card className="shadow-8 border-round-2xl text-white p-fluid capture-card">
          <div className="mb-3 border-bottom-1 border-gray-700 pb-2">
             <h2 className="text-xl font-bold text-white m-0">{grupoActivo?.descripcion || "Conteo de Inventario"}</h2>
             <p className="text-gray-400 text-sm mt-1">
                Fecha: {grupoActivo?.fecha || "---"}
             </p>
          </div>

          <div className="flex flex-column gap-2">
            <div className="field flex flex-column gap-2">
              <label className="font-bold text-gray-300">Buscar producto</label>
              <AutoComplete
                value={textoBusqueda}
                suggestions={resultadosProductos}
                completeMethod={buscarProductos}
                dropdown
                field="nombre"
                placeholder="Referencia o nombre..."
                inputClassName="p-3 text-lg bg-gray-900 border-gray-700 text-white"
                className="w-full"
                invalid={intentoSometido && !productoSeleccionado}
                onChange={(e: AutoCompleteChangeEvent) => setTextoBusqueda(e.value)}
                onSelect={(e: AutoCompleteSelectEvent) => {
                  setProductoSeleccionado(e.value);
                  setTextoBusqueda(e.value.nombre);
                }}
                itemTemplate={(item: Producto) => (
                  <div className="flex flex-column p-1">
                    <span className="font-bold text-blue-400">{item.nombre}</span>
                    <small className="text-gray-400">{item.referencia}</small>
                  </div>
                )}
              />
            </div>

            {productoSeleccionado && (
              <div className="border-round-xl p-2 mb-1 capture-product-info">
                 <div className="flex align-items-center gap-2">
                    <i className="pi pi-tag text-blue-400"></i>
                    <span className="font-bold text-blue-100">{productoSeleccionado.nombre}</span>
                 </div>
                 <div className="text-gray-400 text-xs ml-4 mt-1">REF: {productoSeleccionado.referencia}</div>
              </div>
            )}

            <div className="field flex flex-column gap-2">
              <label className="font-bold text-gray-300">Bodega</label>
              <Dropdown
                value={bodegaSeleccionada}
                options={bodegas}
                optionLabel="nombre"
                placeholder="Seleccione bodega"
                className="bg-gray-900 border-gray-700 text-white capture-dropdown"
                onChange={(e: DropdownChangeEvent) => setBodegaSeleccionada(e.value)}
                invalid={intentoSometido && !bodegaSeleccionada}
              />
            </div>

            <div className="field flex flex-column gap-2">
              <label className="font-bold text-gray-300">Ubicación</label>
              <Dropdown
                value={ubicacionSeleccionada}
                options={ubicaciones}
                optionLabel="nombre"
                placeholder="Seleccione ubicación"
                disabled={!bodegaSeleccionada}
                className="bg-gray-900 border-gray-700 text-white capture-dropdown"
                onChange={(e: DropdownChangeEvent) => setUbicacionSeleccionada(e.value)}
                invalid={intentoSometido && !ubicacionSeleccionada}
              />
            </div>

            <div className="field flex flex-column gap-2">
              <label className="font-bold text-gray-300">Cantidad</label>
              <InputNumber
                value={cantidad}
                onValueChange={(e) => setCantidad(e.value ?? null)}
                placeholder="0"
                inputClassName="text-center text-4xl font-bold p-2 bg-gray-900 border-gray-700 text-white capture-input-number-input"
                min={0}
                invalid={intentoSometido && (!cantidad || cantidad <= 0)}
                minFractionDigits={0}
                maxFractionDigits={5}
                useGrouping={false}
              />
            </div>

            <Button
              label="GUARDAR CONTEO"
              icon="pi pi-check"
              className="p-3 text-xl font-bold mt-1 shadow-4"
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
