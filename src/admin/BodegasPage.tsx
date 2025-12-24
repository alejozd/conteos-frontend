import { useEffect, useState, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import axios from "axios";
import api from "../services/api";

interface Bodega {
  id: number;
  nombre: string;
}

interface ApiError {
  message: string;
}

export default function BodegasPage() {
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [bodegaEdit, setBodegaEdit] = useState<Bodega | null>(null);

  const toast = useRef<Toast>(null);

  const cargarBodegas = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await api.get("/api/admin/bodegas");
      setBodegas(resp.data);
    } catch (err) {
      console.error("Error cargando bodegas", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarBodegas();
  }, [cargarBodegas]);

  const guardar = async () => {
    if (!nombre.trim()) return;

    try {
      if (bodegaEdit) {
        await api.put(`/api/admin/bodegas/${bodegaEdit.id}`, { nombre });
        toast.current?.show({
          severity: "success",
          summary: "Actualizado",
          detail: "Bodega actualizada correctamente",
        });
      } else {
        await api.post("/api/admin/bodegas", { nombre });
        toast.current?.show({
          severity: "success",
          summary: "Creado",
          detail: "Bodega creada correctamente",
        });
      }

      setVisible(false);
      setNombre("");
      setBodegaEdit(null);
      cargarBodegas();
    } catch (error) {
      console.error(error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar la bodega",
      });
    }
  };

  const eliminar = async (row: Bodega) => {
    try {
      await api.delete(`/api/admin/bodegas/${row.id}`);

      toast.current?.show({
        severity: "success",
        summary: "Eliminado",
        detail: "Bodega eliminada correctamente",
      });

      cargarBodegas();
    } catch (error) {
      console.error(error);

      let mensaje = "No se pudo eliminar la bodega";

      if (axios.isAxiosError<ApiError>(error)) {
        mensaje =
          error.response?.data?.message ??
          "No se puede eliminar la bodega porque tiene ubicaciones asociadas";
      }

      toast.current?.show({
        severity: "warn",
        summary: "No se puede eliminar",
        detail: mensaje,
        life: 5000,
      });
    }
  };

  const confirmarEliminar = (row: Bodega) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la bodega "${row.nombre}"?`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: () => eliminar(row),
    });
  };

  const nuevaBodega = () => {
    setBodegaEdit(null);
    setNombre("");
    setVisible(true);
  };

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
      <h3 className="m-0 text-xl font-semibold">Gestión de Bodegas</h3>
      <Button label="Nueva Bodega" icon="pi pi-plus" onClick={nuevaBodega} />
    </div>
  );

  const accionesTemplate = (row: Bodega) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        rounded
        text
        severity="info"
        onClick={() => {
          setBodegaEdit(row);
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
      />
    </div>
  );

  return (
    <div className="card shadow-2 border-round">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={bodegas}
        loading={loading}
        stripedRows
        header={header} // Usamos el header de la DataTable
        className="mt-2"
        showGridlines
      >
        <Column
          field="nombre"
          header="Nombre de la Bodega"
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
        header={bodegaEdit ? "Editar Bodega" : "Registrar Nueva Bodega"}
        visible={visible}
        onHide={() => setVisible(false)}
        style={{ width: "90vw", maxWidth: "400px" }} // Responsive width
        draggable={false}
        resizable={false}
      >
        <div className="flex flex-column gap-2 mt-2">
          <label htmlFor="nombre" className="font-medium text-900">
            Nombre
          </label>
          <InputText
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full"
            placeholder="Ej: Bodega Central"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && nombre.trim() && guardar()}
          />
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label="Cancelar"
            text
            severity="secondary"
            onClick={() => setVisible(false)}
          />
          <Button
            label="Guardar Bodega"
            icon="pi pi-check"
            onClick={guardar}
            disabled={!nombre.trim()}
          />
        </div>
      </Dialog>
    </div>
  );
}
