// src/admin/AsignacionTareas.tsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { PickList } from "primereact/picklist";
import type { PickListChangeEvent } from "primereact/picklist";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { useAuth } from "../hooks/useAuth";
import { Tag } from "primereact/tag";
import api from "../services/api";

// INTERFACES ============================
interface Ubicacion {
  id: number;
  nombre: string;
}
interface UsuarioBackend {
  id: number;
  username: string;
  role: string;
}
interface Usuario {
  id: number;
  nombre: string;
  role: string;
}
interface GrupoConteo {
  id: number;
  descripcion: string;
  activo: number;
}
interface Bodega {
  id: number;
  nombre: string;
}

interface ResumenAsignacion {
  bodega_nombre: string;
  total_ubicaciones: number;
}

export default function AsignacionTareas() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const grupoIdUrl = query.get("grupoId");

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSel, setUsuarioSel] = useState<Usuario | null>(null);
  const [grupos, setGrupos] = useState<GrupoConteo[]>([]);
  const [grupoSel, setGrupoSel] = useState<GrupoConteo | null>(null);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [bodegaSel, setBodegaSel] = useState<Bodega | null>(null);
  const [disponibles, setDisponibles] = useState<Ubicacion[]>([]);
  const [asignadas, setAsignadas] = useState<Ubicacion[]>([]);
  const [resumenCarga, setResumenCarga] = useState<ResumenAsignacion[]>([]);
  const { user } = useAuth();
  const toast = useRef<Toast>(null);

  // 1. Cargar datos maestros (Solo al montar)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [resUsers, resGrupos, resBodegas] = await Promise.all([
          api.get<UsuarioBackend[]>("/api/admin/usuarios"),
          api.get<GrupoConteo[]>("/api/conteos/grupos/activos"),
          api.get<Bodega[]>("/api/bodegas/listar"),
        ]);

        const listaUsuarios: Usuario[] = resUsers.data
          .filter((u) => u.role !== "admin")
          .map((u) => ({ id: u.id, nombre: u.username, role: u.role }));

        setUsuarios(listaUsuarios);
        setGrupos(resGrupos.data);
        setBodegas(resBodegas.data);

        if (grupoIdUrl) {
          const encontrado = resGrupos.data.find(
            (g) => String(g.id) === grupoIdUrl
          );
          if (encontrado) setGrupoSel(encontrado);
        }
      } catch (err) {
        console.error("Error maestros:", err);
      }
    };
    loadInitialData();
  }, [grupoIdUrl]);

  // 2. Cargar ubicaciones (SOLO cuando los tres campos están llenos)
  useEffect(() => {
    if (bodegaSel && usuarioSel && grupoSel) {
      const cargarUbicaciones = async () => {
        try {
          const [resTodas, resAsig] = await Promise.all([
            api.get<Ubicacion[]>(
              `/api/ubicaciones/listar?bodegaId=${bodegaSel.id}`
            ),
            api.get<Ubicacion[]>(
              `/api/asignacion/admin/ubicaciones-usuario?usuarioId=${usuarioSel.id}&bodegaId=${bodegaSel.id}`
            ),
          ]);

          const actuales = resAsig.data || [];
          const todas = resTodas.data || [];
          const idsAsignados = new Set(actuales.map((a) => a.id));

          setAsignadas(actuales);
          setDisponibles(todas.filter((u) => !idsAsignados.has(u.id)));
        } catch (err) {
          console.error("Error cargando ubicaciones:", err);
        }
      };
      cargarUbicaciones();
    }
  }, [bodegaSel, usuarioSel, grupoSel]);

  // Función para resetear listas al cambiar selección
  const resetListas = () => {
    setDisponibles([]);
    setAsignadas([]);
  };

  useEffect(() => {
    // Definimos una función interna para que React entienda que es un proceso asíncrono controlado
    const fetchResumen = async () => {
      if (usuarioSel && grupoSel) {
        try {
          const res = await api.get<ResumenAsignacion[]>(
            `/api/asignacion/admin/resumen-usuario?usuarioId=${usuarioSel.id}&grupoId=${grupoSel.id}`
          );
          setResumenCarga(res.data);
        } catch (err) {
          console.error("Error al cargar resumen", err);
        }
      } else {
        setResumenCarga([]); // Limpia el resumen si no hay selección
      }
    };

    fetchResumen();
  }, [usuarioSel, grupoSel]);

  const handleGuardar = async () => {
    if (!usuarioSel || !grupoSel || !bodegaSel) return;

    try {
      // Usamos el endpoint que ya tienes: guardarMasivoAdmin
      await api.post("/api/asignacion/guardar-masivo", {
        usuario_id: usuarioSel.id,
        conteo_grupo_id: grupoSel.id,
        bodega_id: bodegaSel.id,
        ubicaciones: asignadas.map((u) => u.id),
        empresa_id: user?.empresa_id,
      });

      toast.current?.show({
        severity: "success",
        summary: "Sincronizado",
        detail: `Tareas de ${usuarioSel.nombre} actualizadas en ${bodegaSel.nombre}`,
      });

      // OPCIONAL: Podrías volver a disparar la carga de ubicaciones
      // para confirmar que lo que quedó en la DB es lo que ves en pantalla
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo sincronizar la asignación, " + err,
      });
    }
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <Card
        title="Gestión de Asignaciones (Administrador)"
        className="shadow-4"
      >
        <div className="grid">
          <div className="col-12 md:col-4 flex flex-column gap-2 mb-3">
            <label className="font-bold">Grupo de Conteo</label>
            <Dropdown
              value={grupoSel}
              options={grupos}
              onChange={(e) => {
                setGrupoSel(e.value);
                resetListas();
              }}
              optionLabel="descripcion"
              placeholder="Seleccione Grupo"
              className="w-full"
              filter
            />
          </div>

          <div className="col-12 md:col-4 flex flex-column gap-2 mb-3">
            <label className="font-bold">Operario</label>
            <Dropdown
              value={usuarioSel}
              options={usuarios}
              onChange={(e) => {
                setUsuarioSel(e.value);
                resetListas();
              }}
              optionLabel="nombre"
              placeholder="Seleccione Operario"
              className="w-full"
              filter
            />
          </div>

          <div className="col-12 md:col-4 flex flex-column gap-2 mb-3">
            <label className="font-bold">Bodega</label>
            <Dropdown
              value={bodegaSel}
              options={bodegas}
              onChange={(e) => {
                setBodegaSel(e.value);
                resetListas();
              }}
              optionLabel="nombre"
              placeholder="Seleccione Bodega"
              className="w-full"
              filter
            />
          </div>
        </div>

        {/* Panel de Resumen de Carga */}
        {usuarioSel && resumenCarga.length > 0 && (
          <div className="mb-4">
            <div className="p-3 border-round bg-gray-800 text-white shadow-2">
              <div className="flex align-items-center mb-2">
                <i className="pi pi-briefcase mr-2 text-blue-400" />
                <span className="font-bold">
                  Distribución de tareas (Bodegas) para {usuarioSel.nombre}:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {resumenCarga.map((item, index) => (
                  <Tag
                    key={index}
                    severity="info"
                    value={`${item.bodega_nombre}: ${item.total_ubicaciones} ubicaciones`}
                    style={{ fontSize: "0.9rem" }}
                  />
                ))}
              </div>
              <small className="block mt-2 text-gray-400 italic">
                * Selecciona una bodega para editar sus ubicaciones en el
                PickList.
              </small>
            </div>
          </div>
        )}

        <div className="mt-4">
          <PickList
            dataKey="id"
            source={disponibles}
            target={asignadas}
            onChange={(e: PickListChangeEvent) => {
              setDisponibles(e.source);
              setAsignadas(e.target);
            }}
            itemTemplate={(item: Ubicacion) => (
              <div className="flex align-items-center p-2">
                <i className="pi pi-map-marker mr-2 text-primary" />
                <span>{item.nombre}</span>
              </div>
            )}
            sourceHeader="Ubicaciones Disponibles"
            targetHeader="Ubicaciones Asignadas"
            sourceStyle={{ height: "30rem" }}
            targetStyle={{ height: "30rem" }}
            breakpoint="960px"
            showSourceControls={false}
            showTargetControls={false}
          />
        </div>

        <div className="flex justify-end mt-4">
          <Button
            label="Guardar Asignaciones"
            icon="pi pi-save"
            onClick={handleGuardar}
            className="p-button-success p-button-lg"
            disabled={!usuarioSel || !bodegaSel || !grupoSel}
          />
        </div>
      </Card>
    </div>
  );
}
