// src/components/ConteoOperario.tsx

import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

import { Card } from "primereact/card";
import { InputNumber } from "primereact/inputnumber";
import { useNavigate } from "react-router-dom";
import {
  AutoComplete,
  type AutoCompleteChangeEvent,
  type AutoCompleteSelectEvent,
  type AutoCompleteCompleteEvent,
} from "primereact/autocomplete";

import {
  Dropdown,
  type DropdownChangeEvent,
} from "primereact/dropdown";

import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { confirmDialog } from "primereact/confirmdialog";
import { ConfirmDialog } from "primereact/confirmdialog";

import "../styles/ConteoOperario.css";
import "../styles/overlay.css";

// TIPOS ============================
interface Producto {
  codigo: string | number;
  subcodigo: string | number;
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
  const { grupoActivo, setGrupoActivo, logout   } = useAuth();
  const toast = useRef<Toast>(null);
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const grupoId = params.get("grupo");
  const navigate = useNavigate();

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


  // 0. Recuperar grupoActivo si está en null al recargar ==================
useEffect(() => {
  // si ya tenemos grupoActivo no necesitamos hacer nada
  if (grupoActivo) return;

  // si no viene el id en la URL tampoco podemos recuperar
  if (!grupoId) return;

  const fetchGrupoById = async () => {
    try {
      const res = await api.get("/api/conteos/grupos/activos");
      const grupos = Array.isArray(res.data) ? res.data : [];

      const g = grupos.find((x) => String(x.id) === String(grupoId));
      if (g) {
        setGrupoActivo(g); // recupera el grupo en memoria
      } else {
        console.warn("El grupo no está dentro de los grupos activos.");
        // Aquí podrías redirigir a SeleccionarGrupo si quieres
        // navigate("/seleccionar-grupo");
      }
    } catch (error) {
      console.error("Error recuperando grupo por id:", error);
    }
  };

  fetchGrupoById();
}, [grupoId, grupoActivo, setGrupoActivo]);

  // 1. Cargar ubicaciones =========================
  useEffect(() => {
  const fetchBodegas = async () => {
    try {
      const res = await api.get("/api/bodegas/listar");
      setBodegas(res.data);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las bodegas",
      });
    }
  };

  fetchBodegas();
}, []);

  useEffect(() => {
  if (!bodegaSeleccionada) {
    setUbicaciones([]);
    setUbicacionSeleccionada(null);
    return;
  }

  const fetchUbicaciones = async () => {
    try {
      const res = await api.get(
        `/api/ubicaciones/listar?bodegaId=${bodegaSeleccionada.id}`
      );
      const data: Ubicacion[] = res.data || [];
      setUbicaciones(data);

      if (data.length > 0) {
        setUbicacionSeleccionada(data[0]);
      } else {
        setUbicacionSeleccionada(null);
      }
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las ubicaciones",
      });
    }
  };

  fetchUbicaciones();
}, [bodegaSeleccionada]);


  // 2. Buscar productos =========================
  const buscarProductos = async (e: AutoCompleteCompleteEvent) => {
    try {
      const q = (e.query ?? "").trim();
      if (q.length < 2) {
        setResultadosProductos([]);
        return;
      }

      const res = await api.get(`/api/productos/buscar?texto=${encodeURIComponent(q)}`);
      setResultadosProductos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  // 3. Guardar conteo =========================
const confirmarGuardado = () => {
  confirmDialog({
    header: "Confirmar conteo",
    message: (
      <div>
        <p><strong>Producto:</strong> {productoSeleccionado?.nombre}</p>
        <p><strong>Referencia:</strong> {productoSeleccionado?.referencia}</p>
        <p><strong>Bodega:</strong> {bodegaSeleccionada?.nombre}</p>
        <p><strong>Ubicación:</strong> {ubicacionSeleccionada?.nombre}</p>
        <p><strong>Cantidad:</strong> {cantidad}</p>
      </div>
    ),
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Sí, guardar",
    rejectLabel: "Cancelar",
    acceptClassName: "p-button-success",
    rejectClassName: "p-button-danger p-button-text",
    defaultFocus: "accept",
    accept: guardar,
  });
};

  const guardar = async () => {
    // VALIDACIONES =====================
  if (!productoSeleccionado) {
    toast.current?.show({
      severity: "warn",
      summary: "Producto requerido",
      detail: "Debes seleccionar un producto antes de continuar",
    });
    return;
  }

  if (cantidad === null || cantidad <= 0) {
    toast.current?.show({
      severity: "warn",
      summary: "Cantidad inválida",
      detail: "La cantidad debe ser mayor a 0",
    });
    return;
  }

  if (!bodegaSeleccionada) {
  toast.current?.show({
    severity: "warn",
    summary: "Bodega requerida",
    detail: "Selecciona una bodega",
  });
  return;
}

  if (!ubicacionSeleccionada) {
    toast.current?.show({
      severity: "warn",
      summary: "Ubicación requerida",
      detail: "Selecciona una ubicación",
    });
    return;
  }

    try {
        setLoading(true);
      await api.post("/api/conteos/guardar", {
        codigo: productoSeleccionado.codigo,
        subcodigo: productoSeleccionado.subcodigo,
        ubicacion_id: ubicacionSeleccionada.id,
        cantidad,
        conteo_grupo_id: Number(grupoId),
      });

      toast.current?.show({
        severity: "success",
        summary: "Guardado",
        detail: "Movimiento registrado correctamente",
      });

      setProductoSeleccionado(null);
      setCantidad(null);
      setUbicacionSeleccionada(null);
      setTextoBusqueda("");
      setResultadosProductos([]);

    } catch (error) {      
        let msg = "No se pudo guardar el conteo";
        if (error instanceof Error) {
            msg = error.message;
        }
      toast.current?.show({ 
        severity: "error",
        summary: "Error",
        detail: msg,
      });
    } finally {
    setLoading(false);
  }
  };

  const handleLogout = () => {
  logout();
  navigate("/login");
};

  return (
    <div className="conteo-container">
      <ConfirmDialog />
{loading && (
  <div className="overlay-mask-spinner">    
    <ProgressSpinner style={{ width: '80px', height: '80px' }} strokeWidth="6" />
    <p>Guardando...</p>
  </div>
)}

      <Toast ref={toast} />

      <Card className="conteo-card shadow-4 border-round-xl">
         <div className="logout-container">
    <Button
      label="Salir"
      icon="pi pi-sign-out"
      className="p-button-danger p-button-sm"
      text
      onClick={handleLogout}
    />
  </div>
        <h2 className="conteo-titulo">Conteo: {grupoActivo?.descripcion}</h2>
        <p className="conteo-fecha">
          Fecha: <strong>{grupoActivo?.fecha}</strong>
        </p>

        {/* BUSCADOR DE PRODUCTO */}
        <div className="form-section">
          <label className="label">Buscar producto</label>

          <AutoComplete
            value={textoBusqueda}
            suggestions={resultadosProductos}
            completeMethod={buscarProductos}
            dropdown
            field="nombre"
            placeholder="Escribe referencia o nombre..."
            className={`w-full ${!productoSeleccionado ? "p-invalid" : ""}`}
            onChange={(e: AutoCompleteChangeEvent<string | Producto>) => {
              const v = e.value;

              if (typeof v === "string") {
                setTextoBusqueda(v);
              } else if (v) {
                const prod = v as Producto;
                setTextoBusqueda(prod.nombre);
                setProductoSeleccionado(prod);
              }
            }}
            onSelect={(e: AutoCompleteSelectEvent) => {
              const prod = e.value as Producto;
              setProductoSeleccionado(prod);
              setTextoBusqueda(prod.nombre);
            }}
            itemTemplate={(item: Producto) => (
              <div className="item-producto">
                <div className="nombre">{item.nombre}</div>
                <div className="referencia">{item.referencia}</div>
              </div>
            )}
          />
        </div>

        {/* INFO DEL PRODUCTO */}
        {productoSeleccionado && (
            <Card title={productoSeleccionado.nombre} className="producto-info">
                <p className="ref">Ref: {productoSeleccionado.referencia}</p>
            </Card>
        )}

{/* BODEGA */}
<div className="form-section">
  <label className="label">Bodega</label>
  <Dropdown
    value={bodegaSeleccionada}
    options={bodegas}
    optionLabel="nombre"
    placeholder="Selecciona bodega"
    className={`w-full ${!bodegaSeleccionada ? "p-invalid" : ""}`}
    onChange={(e: DropdownChangeEvent) => {
      setBodegaSeleccionada(e.value as Bodega);
      setUbicacionSeleccionada(null);
    }}
  />
</div>

        {/* UBICACIÓN */}
        <div className="form-section">
  <label className="label">Ubicación</label>
  <Dropdown
    value={ubicacionSeleccionada}
    options={ubicaciones}
    optionLabel="nombre"
    placeholder={
      bodegaSeleccionada
        ? "Selecciona ubicación"
        : "Primero selecciona una bodega"
    }
    disabled={!bodegaSeleccionada}
    className={`w-full ${!ubicacionSeleccionada ? "p-invalid" : ""}`}
    onChange={(e: DropdownChangeEvent) =>
      setUbicacionSeleccionada(e.value as Ubicacion)
    }
  />
</div>

        {/* CANTIDAD */}
        <div className="form-section">
          <label className="label">Cantidad</label>
          <InputNumber
            value={cantidad}
            onValueChange={(e) => setCantidad(e.value ?? null)}
            className={`w-full ${cantidad !== null && cantidad <= 0 ? "p-invalid" : ""}`}
            min={0}
            minFractionDigits={2} 
            maxFractionDigits={5}
          />
        </div>

        <Button
          label="Guardar conteo"
          icon="pi pi-check"
          className="w-full mt-3"
          onClick={confirmarGuardado}
          loading={loading}
        />
      </Card>
    </div>
  );
}
