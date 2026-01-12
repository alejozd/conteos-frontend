import { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ConteoGrupoDialog from "./ConteoGrupoDialog";

interface ConteoGrupoRow {
  id: number;
  fecha: string;
  descripcion: string;
  activo: number;
  created_at: string;
}

export default function ConteosGruposAdmin() {
  const navigate = useNavigate();
  const [data, setData] = useState<ConteoGrupoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState<ConteoGrupoRow | null>(
    null
  );
  const [globalFilter, setGlobalFilter] = useState("");
  const toast = useRef<Toast>(null);

  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/conteos-grupos");
      setData(res.data || []);
    } catch (error) {
      console.error("Error cargando grupos:", error);
    } finally {
      setLoading(false);
    }
  };

  const desactivarGrupo = (row: ConteoGrupoRow) => {
    const esDesactivar = row.activo === 1;

    confirmDialog({
      // MENSAJE ACTUALIZADO: Eliminamos la advertencia de que otros se cerrarán
      message: esDesactivar
        ? `¿Desea desactivar el grupo "${row.descripcion}"?`
        : `¿Desea activar el grupo "${row.descripcion}" para permitir nuevas asignaciones?`,
      header: esDesactivar ? "Confirmar Desactivación" : "Confirmar Activación",
      icon: esDesactivar ? "pi pi-lock" : "pi pi-lock-open",
      acceptLabel: esDesactivar ? "Sí, desactivar" : "Sí, activar",
      rejectLabel: "Cancelar",
      acceptClassName: esDesactivar ? "p-button-danger" : "p-button-success",
      accept: async () => {
        try {
          if (esDesactivar) {
            await api.put(`/api/admin/conteos-grupos/${row.id}/desactivar`);
          } else {
            await api.put(`/api/admin/conteos-grupos/${row.id}/activar`);
          }

          toast.current?.show({
            severity: "success",
            summary: esDesactivar ? "Inactivado" : "Activado",
            detail: `El grupo fue ${
              esDesactivar ? "desactivado" : "activado"
            } correctamente`,
            life: 3000,
          });
          cargarGrupos();
        } catch (error) {
          console.error("Error al cambiar estado del grupo:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo cambiar el estado del grupo",
          });
        }
      },
    });
  };

  const header = (
    <div className="flex flex-column gap-3">
      {/* FILA SUPERIOR */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
        <div className="flex align-items-center gap-3">
          <i className="pi pi-calendar-plus text-primary text-3xl" />
          <h2 className="m-0 text-3xl font-bold text-900 tracking-tight">
            Grupos de Conteo
          </h2>
        </div>
        <Button
          label="Nuevo Conteo"
          icon="pi pi-plus"
          severity="success"
          className="p-button-sm shadow-2"
          onClick={() => {
            setGrupoEditando(null);
            setDialogVisible(true);
          }}
        />
      </div>

      {/* FILA DE FILTRO (Estilo oscuro consistente) */}
      <div className="flex flex-column md:flex-row md:align-items-center gap-3 bg-gray-900 p-3 border-round border-1 border-gray-800">
        <div className="flex flex-column gap-1 flex-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Búsqueda rápida
          </label>
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search text-gray-400" />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar por descripción o fecha..."
              className="p-inputtext-sm w-full md:w-25rem"
            />
          </IconField>
        </div>
        <div className="hidden md:flex align-items-center gap-2 bg-gray-800 px-3 py-2 border-round-xl border-1 border-gray-700 ml-auto">
          <span className="text-sm text-gray-400">Total Grupos:</span>
          <span className="text-lg font-bold text-green-400">
            {data.length}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="card shadow-2 border-round">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={data}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 20]}
        header={header}
        globalFilter={globalFilter}
        globalFilterFields={["descripcion", "fecha"]}
        emptyMessage="No hay conteos creados"
        stripedRows
        showGridlines
        className="mt-2"
      >
        <Column
          field="fecha"
          header="Fecha"
          sortable
          style={{ width: "15%" }}
        />
        <Column
          field="descripcion"
          header="Descripción"
          sortable
          style={{ minWidth: "20rem" }}
        />
        <Column
          header="Estado"
          style={{ width: "10%", textAlign: "center" }}
          body={(row: ConteoGrupoRow) => (
            <Tag
              value={row.activo ? "ACTIVO" : "INACTIVO"}
              severity={row.activo ? "success" : "danger"}
              className="px-3"
            />
          )}
        />
        <Column
          header="Acciones"
          style={{ width: "10%", textAlign: "center" }}
          body={(row: ConteoGrupoRow) => (
            <div className="flex gap-2 justify-content-center">
              <Button
                icon="pi pi-pencil"
                rounded
                text
                severity="info"
                onClick={() => {
                  setGrupoEditando(row);
                  setDialogVisible(true);
                }}
                tooltip="Editar"
              />
              <Button
                icon={row.activo ? "pi pi-lock-open" : "pi pi-lock"}
                rounded
                text
                severity="danger"
                onClick={() => desactivarGrupo(row)}
                tooltip={row.activo ? "Bloquear" : "Desbloquear"}
                tooltipOptions={{ position: "bottom" }}
              />
              <Button
                icon="pi pi-users"
                rounded
                text
                severity="warning"
                onClick={() =>
                  navigate(`/admin/asignacion-tareas?grupoId=${row.id}`)
                }
                tooltip="Asignar Operarios"
                tooltipOptions={{ position: "bottom" }}
              />
            </div>
          )}
        />
      </DataTable>

      {dialogVisible && (
        <ConteoGrupoDialog
          visible={dialogVisible}
          grupo={grupoEditando}
          onHide={() => setDialogVisible(false)}
          onSuccess={cargarGrupos}
        />
      )}
    </div>
  );
}
