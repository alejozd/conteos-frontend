import { useEffect, useState, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import api from "../services/api";

interface Bodega {
  id: number;
  nombre: string;
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
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar la bodega",
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

  const accionesTemplate = (row: Bodega) => (
    <>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => {
          setBodegaEdit(row);
          setNombre(row.nombre);
          setVisible(true);
        }}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-sm p-button-danger"
        onClick={() => confirmarEliminar(row)}
      />
    </>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="flex justify-content-between mb-3">
        <h3>Bodegas</h3>
        <Button label="Nueva bodega" icon="pi pi-plus" onClick={nuevaBodega} />
      </div>

      <DataTable value={bodegas} loading={loading} stripedRows>
        <Column field="nombre" header="Nombre" />
        <Column body={accionesTemplate} header="Acciones" />
      </DataTable>

      <Dialog
        header={bodegaEdit ? "Editar bodega" : "Nueva bodega"}
        visible={visible}
        onHide={() => setVisible(false)}
        style={{ width: "30rem" }}
      >
        <div className="field">
          <label htmlFor="nombre">Nombre</label>
          <InputText
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full"
            autoFocus
          />
        </div>

        <div className="flex justify-content-end gap-2 mt-3">
          <Button
            label="Cancelar"
            className="p-button-text"
            onClick={() => setVisible(false)}
          />
          <Button label="Guardar" onClick={guardar} disabled={!nombre.trim()} />
        </div>
      </Dialog>
    </div>
  );
}
