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
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import api from "../services/api";

// INTERFACES
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

  // 1. Cargar datos maestros
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

  // 2. Refrescar listas y resumen
  const refrescarTodo = async () => {
    if (!usuarioSel || !grupoSel || !bodegaSel) return;

    try {
      // Ejecutamos las peticiones en paralelo para mejor rendimiento
      const [resResumen, resAsig, resTodas] = await Promise.all([
        api.get<ResumenAsignacion[]>(
          `/api/asignacion/admin/resumen-usuario?usuarioId=${usuarioSel.id}&grupoId=${grupoSel.id}`
        ),
        api.get<Ubicacion[]>(
          `/api/asignacion/admin/ubicaciones-usuario?usuarioId=${usuarioSel.id}&bodegaId=${bodegaSel.id}`
        ),
        api.get<Ubicacion[]>(
          `/api/ubicaciones/listar?bodegaId=${bodegaSel.id}`
        ),
      ]);

      setResumenCarga(resResumen.data);

      const actuales = resAsig.data || [];
      const todas = resTodas.data || [];

      // Mapeo seguro sin usar 'any'
      const idsAsignados = new Set(actuales.map((a: Ubicacion) => a.id));

      setAsignadas(actuales);
      setDisponibles(todas.filter((u: Ubicacion) => !idsAsignados.has(u.id)));
    } catch (err) {
      console.error("Error al refrescar datos:", err);
    }
  };

  useEffect(() => {
    const ejecutarCarga = async () => {
      // Solo disparamos la petición si tenemos los datos necesarios
      if (bodegaSel && usuarioSel && grupoSel) {
        await refrescarTodo();
      }
    };

    ejecutarCarga();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodegaSel?.id, usuarioSel?.id, grupoSel?.id]);

  const confirmarCambioEstado = (ubicacion: Ubicacion) => {
    confirmDialog({
      message: `¿Finalizar '${ubicacion.nombre}'?`,
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Sí, Finalizar",
      rejectLabel: "No",
      accept: async () => {
        try {
          await api.put(`/api/asignacion/admin/estado/${ubicacion.id}`, {
            nuevoEstado: 1,
          });
          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: "Ubicación cerrada",
          });
          refrescarTodo();
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const handleGuardar = async () => {
    if (!usuarioSel || !grupoSel || !bodegaSel) return;
    try {
      await api.post("/api/asignacion/guardar-masivo", {
        usuario_id: usuarioSel.id,
        conteo_grupo_id: grupoSel.id,
        bodega_id: bodegaSel.id,
        ubicaciones: asignadas.map((u) => u.id),
        empresa_id: user?.empresa_id,
      });
      toast.current?.show({
        severity: "success",
        summary: "Guardado",
        detail: "Asignación actualizada",
      });
      refrescarTodo();
    } catch (err) {
      console.error(err);
    }
  };

  // TEMPLATE COMPACTO
  const itemTemplate = (item: Ubicacion, type: "source" | "target") => {
    return (
      <div
        className="flex align-items-center justify-content-between w-full"
        style={{ padding: "0px", margin: "0px", lineHeight: "1" }}
      >
        <div className="flex align-items-center">
          <i
            className="pi pi-map-marker mr-2 text-primary"
            style={{ fontSize: "0.75rem" }}
          />
          <span style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
            {item.nombre}
          </span>
        </div>
        {type === "target" && (
          <Button
            icon="pi pi-check"
            className="p-button-rounded p-button-success p-button-text p-0"
            style={{ width: "1.2rem", height: "1.2rem" }}
            onClick={(e) => {
              e.stopPropagation();
              confirmarCambioEstado(item);
            }}
            tooltip="Finalizar"
            tooltipOptions={{ position: "top" }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-3">
      <Toast ref={toast} />
      <ConfirmDialog />

      <Card
        title="Gestión de Asignaciones (Administrador)"
        className="shadow-4"
      >
        {/* 1. SELECTORES */}
        <div className="grid mb-3">
          <div className="col-12 md:col-4 flex flex-column gap-1">
            <label className="font-bold text-sm">Grupo de Conteo</label>
            <Dropdown
              value={grupoSel}
              options={grupos}
              onChange={(e) => {
                setGrupoSel(e.value);
                setAsignadas([]);
                setDisponibles([]);
              }}
              optionLabel="descripcion"
              placeholder="Seleccione Grupo"
              className="w-full p-inputtext-sm"
              filter
            />
          </div>
          <div className="col-12 md:col-4 flex flex-column gap-1">
            <label className="font-bold text-sm">Operario</label>
            <Dropdown
              value={usuarioSel}
              options={usuarios}
              onChange={(e) => {
                setUsuarioSel(e.value);
                setAsignadas([]);
                setDisponibles([]);
              }}
              optionLabel="nombre"
              placeholder="Seleccione Operario"
              className="w-full p-inputtext-sm"
              filter
            />
          </div>
          <div className="col-12 md:col-4 flex flex-column gap-1">
            <label className="font-bold text-sm">Bodega</label>
            <Dropdown
              value={bodegaSel}
              options={bodegas}
              onChange={(e) => {
                setBodegaSel(e.value);
                setAsignadas([]);
                setDisponibles([]);
              }}
              optionLabel="nombre"
              placeholder="Seleccione Bodega"
              className="w-full p-inputtext-sm"
              filter
            />
          </div>
        </div>

        {/* 2. RESUMEN AZUL */}
        {usuarioSel && resumenCarga.length > 0 && (
          <div className="mb-3 p-3 border-round bg-gray-800 text-white shadow-2">
            <div className="flex align-items-center mb-2">
              <i className="pi pi-briefcase mr-2 text-blue-400" />
              <span className="font-bold text-sm">
                Tareas actuales de {usuarioSel.nombre}:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {resumenCarga.map((item, index) => (
                <Tag
                  key={index}
                  severity="info"
                  value={`${item.bodega_nombre}: ${item.total_ubicaciones}`}
                  style={{ fontSize: "0.75rem" }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 3. PICKLIST (SIN CARD INTERNO) */}
        <div className="mt-2">
          <PickList
            dataKey="id"
            source={disponibles}
            target={asignadas}
            onChange={(e: PickListChangeEvent) => {
              setDisponibles(e.source);
              setAsignadas(e.target);
            }}
            itemTemplate={(item) =>
              itemTemplate(
                item,
                asignadas.some((a) => a.id === item.id) ? "target" : "source"
              )
            }
            sourceHeader="Disponibles"
            targetHeader="Asignadas"
            sourceStyle={{ height: "25rem" }}
            targetStyle={{ height: "25rem" }}
            showSourceControls={false}
            showTargetControls={false}
            breakpoint="960px"
          />
        </div>

        {/* 4. BOTÓN GUARDAR */}
        <div className="flex justify-content-end mt-4">
          <Button
            label="Guardar Cambios"
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
