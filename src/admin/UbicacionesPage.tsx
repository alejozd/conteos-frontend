import { useEffect, useState, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import api from "../services/api";

interface Bodega {
  id: number;
  nombre: string;
}

interface Ubicacion {
  id: number;
  nombre: string;
}

export default function UbicacionesPage() {
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [bodegaSel, setBodegaSel] = useState<Bodega | null>(null);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(false);

  const [visible, setVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [ubicacionEdit, setUbicacionEdit] = useState<Ubicacion | null>(null);

  const toast = useRef<Toast>(null);

  /* ===============================
     Cargar bodegas
  =============================== */
  const cargarBodegas = useCallback(async () => {
    try {
      const resp = await api.get("/api/bodegas/listar");
      setBodegas(resp.data);
    } catch (error) {
      console.error("Error cargando bodegas", error);
    }
  }, []);

  /* ===============================
     Cargar ubicaciones
  =============================== */
  const cargarUbicaciones = useCallback(async () => {
    if (!bodegaSel) return;

    try {
      setLoading(true);
      const resp = await api.get("/api/admin/ubicaciones", {
        params: { bodega_id: bodegaSel.id }, // 👈 aquí el cambio
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

  /* ===============================
     Guardar
  =============================== */
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

  /* ===============================
     Eliminar
  =============================== */
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
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar la ubicación",
      });
    }
  };

  const confirmarEliminar = (row: Ubicacion) => {
    confirmDialog({
      message: `¿Eliminar la ubicación "${row.nombre}"?`,
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: () => eliminar(row),
    });
  };

  /* ===============================
     UI helpers
  =============================== */
  const nuevaUbicacion = () => {
    setUbicacionEdit(null);
    setNombre("");
    setVisible(true);
  };

  const accionesTemplate = (row: Ubicacion) => (
    <>
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => {
          setUbicacionEdit(row);
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

      <div className="flex gap-3 mb-3 align-items-end">
        <div className="flex flex-column">
          <label>Bodega</label>
          <Dropdown
            value={bodegaSel}
            options={bodegas}
            optionLabel="nombre"
            placeholder="Seleccione bodega"
            onChange={(e) => setBodegaSel(e.value)}
            className="w-20rem"
          />
        </div>

        <Button
          label="Nueva ubicación"
          icon="pi pi-plus"
          disabled={!bodegaSel}
          onClick={nuevaUbicacion}
        />
      </div>

      <DataTable
        value={ubicaciones}
        loading={loading}
        stripedRows
        emptyMessage="No hay ubicaciones"
      >
        <Column field="nombre" header="Nombre" />
        <Column body={accionesTemplate} header="Acciones" />
      </DataTable>

      <Dialog
        header={ubicacionEdit ? "Editar ubicación" : "Nueva ubicación"}
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
