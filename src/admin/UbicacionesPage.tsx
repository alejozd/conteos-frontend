import { useEffect, useState, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import axios from "axios";
import api from "../services/api";

interface Bodega {
  id: number;
  nombre: string;
}

interface Ubicacion {
  id: number;
  nombre: string;
}

interface ApiError {
  message: string;
}

export default function UbicacionesPage() {
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [bodegaSel, setBodegaSel] = useState<Bodega | null>(null);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const [visible, setVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [ubicacionEdit, setUbicacionEdit] = useState<Ubicacion | null>(null);

  const toast = useRef<Toast>(null);

  const cargarBodegas = useCallback(async () => {
    try {
      const resp = await api.get("/api/bodegas/listar");
      setBodegas(resp.data);
    } catch (error) {
      console.error("Error cargando bodegas", error);
    }
  }, []);

  const cargarUbicaciones = useCallback(async () => {
    if (!bodegaSel) {
      setUbicaciones([]);
      return;
    }

    try {
      setLoading(true);
      const resp = await api.get("/api/admin/ubicaciones", {
        params: { bodega_id: bodegaSel.id },
      });
      setUbicaciones(resp.data);
    } catch (error) {
      console.error("Error cargando ubicaciones", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las ubicaciones",
      });
    } finally {
      setLoading(false);
    }
  }, [bodegaSel]);

  useEffect(() => {
    cargarBodegas();
  }, [cargarBodegas]);

  useEffect(() => {
    cargarUbicaciones();
  }, [cargarUbicaciones]);

  const guardar = async () => {
    if (!nombre.trim() || !bodegaSel) return;

    try {
      if (ubicacionEdit) {
        await api.put(`/api/admin/ubicaciones/${ubicacionEdit.id}`, {
          nombre,
          bodega_id: bodegaSel.id,
        });
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Ubicación actualizada correctamente",
        });
      } else {
        await api.post("/api/admin/ubicaciones", {
          nombre,
          bodega_id: bodegaSel.id,
        });
        toast.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Ubicación creada correctamente",
        });
      }

      setVisible(false);
      setNombre("");
      setUbicacionEdit(null);
      cargarUbicaciones();
    } catch (error) {
      console.error(error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar la ubicación",
      });
    }
  };

  const eliminar = async (row: Ubicacion) => {
    try {
      await api.delete(`/api/admin/ubicaciones/${row.id}`);
      toast.current?.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Ubicación eliminada correctamente",
      });
      cargarUbicaciones();
    } catch (error) {
      console.error(error);
      let mensaje = "No se pudo eliminar la ubicación";
      if (axios.isAxiosError<ApiError>(error)) {
        mensaje =
          error.response?.data?.message ??
          "No se puede eliminar la ubicación porque tiene conteos asociados";
      }
      toast.current?.show({
        severity: "warn",
        summary: "Operación no permitida",
        detail: mensaje,
      });
    }
  };

  const confirmarEliminar = (row: Ubicacion) => {
    confirmDialog({
      message: `¿Eliminar la ubicación "${row.nombre}"?`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: () => eliminar(row),
    });
  };

  const nuevaUbicacion = () => {
    setUbicacionEdit(null);
    setNombre("");
    setVisible(true);
  };

  const accionesTemplate = (row: Ubicacion) => (
    <div className="flex gap-2 justify-content-center">
      <Button
        icon="pi pi-pencil"
        rounded
        text
        severity="info"
        onClick={() => {
          setUbicacionEdit(row);
          setNombre(row.nombre);
          setVisible(true);
        }}
        tooltip="Editar"
      />
      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        onClick={() => confirmarEliminar(row)}
        tooltip="Eliminar"
        tooltipOptions={{ position: "bottom" }}
      />
    </div>
  );

  const header = (
    <div className="flex flex-column gap-3">
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
        <div className="flex align-items-center gap-2">
          <i className="pi pi-map-marker text-primary text-2xl" />
          <h3 className="m-0 text-xl font-semibold">Ubicaciones por Bodega</h3>
        </div>
        <Button
          label="Nueva Ubicación"
          icon="pi pi-plus"
          disabled={!bodegaSel}
          className="p-button-sm shadow-1"
          onClick={nuevaUbicacion}
        />
      </div>

      <div className="flex flex-column md:flex-row md:align-items-center gap-3 bg-gray-900 p-3 border-round">
        <div className="flex flex-column gap-1 flex-1">
          <label className="text-sm font-semibold text-gray-400">
            Seleccionar Bodega
          </label>
          <Dropdown
            value={bodegaSel}
            options={bodegas}
            optionLabel="nombre"
            placeholder="Seleccione una bodega para ver sus ubicaciones"
            onChange={(e) => setBodegaSel(e.value)}
            className="w-full md:w-25rem"
            showClear
          />
        </div>

        <div className="flex flex-column gap-1">
          <label className="text-sm font-semibold text-gray-400">
            Búsqueda rápida
          </label>
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search" />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Filtrar por nombre..."
              className="p-inputtext-sm w-full md:w-15rem"
              disabled={!bodegaSel}
            />
          </IconField>
        </div>
      </div>
    </div>
  );

  return (
    <div className="card shadow-2 border-round">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={ubicaciones}
        loading={loading}
        stripedRows
        header={header}
        className="mt-2"
        showGridlines
        globalFilter={globalFilter}
        globalFilterFields={["nombre"]}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        emptyMessage={
          bodegaSel
            ? "No se encontraron ubicaciones en esta bodega."
            : "Seleccione una bodega para comenzar."
        }
      >
        <Column
          field="nombre"
          header="Nombre de Ubicación"
          sortable
          style={{ minWidth: "12rem" }}
        />
        <Column
          body={accionesTemplate}
          header="Acciones"
          style={{ width: "8rem", textAlign: "center" }}
        />
      </DataTable>

      <Dialog
        header={
          ubicacionEdit ? "Editar Ubicación" : "Registrar Nueva Ubicación"
        }
        visible={visible}
        onHide={() => setVisible(false)}
        style={{ width: "90vw", maxWidth: "400px" }}
        draggable={false}
        resizable={false}
      >
        <div className="flex flex-column gap-3 mt-2">
          <div className="flex flex-column gap-2">
            <label className="text-sm font-bold">Bodega Destino</label>
            <InputText
              value={bodegaSel?.nombre || ""}
              disabled
              className="bg-gray-800"
            />
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="nombre" className="font-medium">
              Nombre de la Ubicación
            </label>
            <InputText
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full"
              placeholder="Ej: Estante A1"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && nombre.trim() && guardar()}
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label="Cancelar"
            text
            severity="danger"
            onClick={() => setVisible(false)}
          />
          <Button
            label="Guardar Ubicación"
            icon="pi pi-check"
            onClick={guardar}
            severity="success"
            disabled={!nombre.trim()}
          />
        </div>
      </Dialog>
    </div>
  );
}
