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

// Nota: He añadido 'id' opcional porque a veces el backend envía el ID de la entidad
// principal como 'id' en lugar de 'bodega_id' en los resultados agrupados.
interface ResumenAsignacion {
  id?: number;
  bodega_id?: number;
  bodega_nombre: string;
  total_ubicaciones: number;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
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
    if (!usuarioSel || !grupoSel) return;
    try {
      const resResumen = await api.get<ResumenAsignacion[]>(
        `/api/asignacion/admin/resumen-usuario?usuarioId=${usuarioSel.id}&grupoId=${grupoSel.id}`
      );
      console.log("LOG RESUMEN - Datos crudos del servidor:", resResumen.data);
      setResumenCarga(resResumen.data);

      if (bodegaSel) {
        const [resAsig, resTodas] = await Promise.all([
          api.get<Ubicacion[]>(
            `/api/asignacion/admin/ubicaciones-usuario?usuarioId=${usuarioSel.id}&bodegaId=${bodegaSel.id}`
          ),
          api.get<Ubicacion[]>(
            `/api/ubicaciones/listar?bodegaId=${bodegaSel.id}`
          ),
        ]);
        const actuales = resAsig.data || [];
        const todas = resTodas.data || [];
        const idsAsignados = new Set(actuales.map((a: Ubicacion) => a.id));
        setAsignadas(actuales);
        setDisponibles(todas.filter((u: Ubicacion) => !idsAsignados.has(u.id)));
      }
    } catch (err) {
      console.error("Error al refrescar:", err);
    }
  };

  useEffect(() => {
    if (usuarioSel && grupoSel) refrescarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodegaSel?.id, usuarioSel?.id, grupoSel?.id]);

  // 3. Finalizar por BODEGA
  const finalizarPorBodega = (
    idParaFinalizar: number,
    bodegaNombre: string
  ) => {
    // LOG DE VALIDACIÓN
    console.log("INTENTO FINALIZAR:", {
      usuario: usuarioSel?.id,
      grupo: grupoSel?.id,
      bodegaIdRecibido: idParaFinalizar,
      bodegaNombre: bodegaNombre,
    });

    if (!usuarioSel?.id || !grupoSel?.id || !idParaFinalizar) {
      toast.current?.show({
        severity: "warn",
        summary: "Atención",
        detail: "No se identificó el ID de la bodega. Verifique consola.",
      });
      return;
    }

    confirmDialog({
      message: `¿Estás seguro de finalizar TODAS las ubicaciones de ${bodegaNombre}?`,
      header: "Confirmar Finalización",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          const payload = {
            usuarioId: Number(usuarioSel.id),
            grupoId: Number(grupoSel.id),
            bodegaId: Number(idParaFinalizar),
          };

          await api.put("/api/asignacion/admin/finalizar-bodega", payload);

          toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: `Bodega ${bodegaNombre} finalizada.`,
          });

          if (bodegaSel?.id === idParaFinalizar) {
            setAsignadas([]);
          }

          await refrescarTodo();
        } catch (err: unknown) {
          const error = err as ApiError;
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error.response?.data?.message || "Error al procesar la solicitud",
          });
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

  const itemTemplate = (item: Ubicacion) => (
    <div className="flex align-items-center w-full" style={{ lineHeight: "1" }}>
      <i
        className="pi pi-map-marker mr-2 text-primary"
        style={{ fontSize: "0.75rem" }}
      />
      <span style={{ fontSize: "0.85rem" }}>{item.nombre}</span>
    </div>
  );

  return (
    <div className="p-3">
      <Toast ref={toast} />
      <ConfirmDialog />

      <Card
        title="Gestión de Asignaciones (Administrador)"
        className="shadow-4"
      >
        {/* SELECTORES */}
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

        {/* RESUMEN DE CARGA (Ajustado) */}
        {usuarioSel && resumenCarga.length > 0 && (
          <div className="mb-3 p-3 border-round bg-gray-800 text-white shadow-2">
            <div className="flex align-items-center mb-2">
              <i className="pi pi-briefcase mr-2 text-blue-400" />
              <span className="font-bold text-sm">
                Tareas actuales de {usuarioSel.nombre}:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {resumenCarga.map((item, index) => {
                // BUSQUEDA DE EMERGENCIA: Como el backend no manda el ID, lo buscamos por nombre
                // en la lista de bodegas que cargamos al inicio.
                const bodegaEncontrada = bodegas.find(
                  (b) => b.nombre === item.bodega_nombre
                );

                // Si viene el ID del backend lo usa, si no, usa el encontrado por nombre
                const idReal =
                  item.bodega_id || item.id || bodegaEncontrada?.id;

                return (
                  <div
                    key={index}
                    className="flex align-items-center bg-blue-600 border-round pr-2"
                  >
                    <Tag
                      severity="info"
                      value={`${item.bodega_nombre}: ${item.total_ubicaciones} ubic.`}
                    />
                    <Button
                      icon="pi pi-check-circle"
                      className="p-button-rounded p-button-text p-button-plain text-white p-0 ml-1"
                      style={{ width: "1.2rem", height: "1.2rem" }}
                      tooltip="Finalizar esta bodega"
                      onClick={() => {
                        if (!idReal) {
                          toast.current?.show({
                            severity: "error",
                            summary: "Error",
                            detail: `No se encontró el ID para la bodega: ${item.bodega_nombre}`,
                          });
                          return;
                        }
                        finalizarPorBodega(Number(idReal), item.bodega_nombre);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PICKLIST */}
        <div className="mt-2">
          <PickList
            dataKey="id"
            source={disponibles}
            target={asignadas}
            onChange={(e: PickListChangeEvent) => {
              setDisponibles(e.source);
              setAsignadas(e.target);
            }}
            itemTemplate={itemTemplate}
            sourceHeader="Disponibles"
            targetHeader="Asignadas"
            sourceStyle={{ height: "25rem" }}
            targetStyle={{ height: "25rem" }}
            showSourceControls={false}
            showTargetControls={false}
          />
        </div>

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
