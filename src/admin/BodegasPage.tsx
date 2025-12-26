import { useEffect, useState, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { FileUpload, type FileUploadHandlerEvent } from "primereact/fileupload";
import { isAxiosError } from "axios";
import axios from "axios";
import api from "../services/api";

interface ErrorImportacion {
  fila: number;
  campo: string;
  mensaje: string;
}

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
  const [visibleImportar, setVisibleImportar] = useState(false);
  const [loadingImportar, setLoadingImportar] = useState(false);
  const [erroresImportar, setErroresImportar] = useState<ErrorImportacion[]>(
    []
  );
  const fileUploadRef = useRef<FileUpload>(null);

  // Filtro simplificado: Solo necesitamos el string
  const [globalFilter, setGlobalFilter] = useState<string>("");

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

  const subirArchivoBodegas = async (event: FileUploadHandlerEvent) => {
    if (loadingImportar) {
      return;
    }
    const file: File = event.files[0];

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoadingImportar(true);
      setErroresImportar([]);

      const response = await api.post("/api/admin/bodegas/importar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.current?.show({
        severity: "success",
        summary: "Importación finalizada",
        detail: `Total procesados: ${response.data.total}`,
        life: 6000,
      });

      event.options.clear();
      setVisibleImportar(false);
      cargarBodegas(); // refresca la tabla
      setErroresImportar([]);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const data = error.response?.data;

        if (data?.errores) {
          setErroresImportar(data.errores);
        }

        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data?.message || "Error al importar bodegas",
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error inesperado al importar",
        });
      }
    } finally {
      setLoadingImportar(false);
    }
  };

  const accionesTemplate = (row: Bodega) => (
    <div className="flex gap-2 justify-content-center">
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
        tooltipOptions={{ position: "bottom" }}
      />
    </div>
  );

  const header = (
    <div className="flex flex-column gap-3">
      {/* FILA SUPERIOR: Título principal con ícono */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
        <div className="flex align-items-center gap-3">
          <i className="pi pi-warehouse text-primary text-3xl" />
          <h2 className="m-0 text-3xl font-bold text-900 tracking-tight">
            Gestión de Bodegas
          </h2>
        </div>

        {/* GRUPO DE ACCIONES: Los botones se mantienen juntos a la derecha */}
        <div className="flex gap-2">
          <Button
            label="Importar"
            icon="pi pi-upload"
            severity="secondary"
            outlined
            className="p-button-sm"
            onClick={() => {
              setErroresImportar([]);
              setVisibleImportar(true);
            }}
          />
          <Button
            label="Nueva Bodega"
            icon="pi pi-plus"
            severity="success"
            className="p-button-sm shadow-2"
            onClick={nuevaBodega}
          />
        </div>
      </div>

      {/* FILA INFERIOR: Barra de búsqueda estilizada */}
      <div className="flex align-items-center bg-gray-900 p-3 border-round border-1 border-gray-800">
        <div className="flex flex-column md:flex-row md:align-items-center gap-3 w-full">
          <div className="flex-1">
            <IconField iconPosition="left">
              <InputIcon className="pi pi-search text-gray-400" />
              <InputText
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar bodega por nombre..."
              />
            </IconField>
          </div>

          {/* Contador resaltado con estilo moderno */}
          <div className="hidden md:flex align-items-center gap-2 bg-gray-800 px-3 py-2 border-round-xl border-1 border-gray-700">
            <span className="text-sm text-gray-400 font-medium">Mostrando</span>
            <span
              className="text-lg font-bold text-green-400"
              style={{ textShadow: "0 0 8px rgba(33, 231, 27, 0.3)" }}
            >
              {bodegas.length}
            </span>
            <span className="text-sm text-gray-400 font-medium text-green-100">
              bodegas activas
            </span>
            <i className="pi pi-check-circle text-green-500 text-sm" />
          </div>
        </div>
      </div>
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
        header={header}
        className="mt-2"
        showGridlines
        // Filtro simplificado aplicado aquí:
        globalFilter={globalFilter}
        globalFilterFields={["nombre"]}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        emptyMessage="No se encontraron bodegas."
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
        onHide={() => {
          setVisible(false);
          setErroresImportar([]);
        }}
        style={{ width: "90vw", maxWidth: "400px" }}
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
            severity="danger"
            onClick={() => setVisible(false)}
          />
          <Button
            label="Guardar Bodega"
            icon="pi pi-check"
            onClick={guardar}
            severity="success"
            disabled={!nombre.trim()}
          />
        </div>
      </Dialog>
      <Dialog
        header="Importar Bodegas desde Excel"
        visible={visibleImportar}
        onHide={() => setVisibleImportar(false)}
        draggable={false}
        resizable={false}
      >
        <div className="field mb-3">
          <FileUpload
            ref={fileUploadRef}
            name="file"
            mode="advanced"
            accept=".xlsx,.xls"
            maxFileSize={5000000}
            multiple={false}
            customUpload
            uploadHandler={subirArchivoBodegas}
            disabled={loadingImportar}
            // OPCIONES DE BOTONES (Aquí definimos los colores)
            chooseOptions={{
              label: loadingImportar ? "Procesando..." : "Seleccionar",
              icon: "pi pi-plus",
              className: "p-button-primary shadow-2",
            }}
            uploadOptions={{
              label: loadingImportar ? "Importando..." : "Importar",
              icon: "pi pi-upload",
              className: "p-button-success shadow-2",
            }}
            cancelOptions={{
              label: "Limpiar",
              icon: "pi pi-times",
              className: "p-button-danger p-button-outlined",
            }}
            // PLANTILLA VACÍA (El centro del cargador)
            emptyTemplate={
              <div className="custom-upload-container">
                <div className="flex justify-content-center mb-3">
                  <i className="pi pi-file-excel text-5xl text-green-500" />
                </div>
                <div className="text-center">
                  <p className="m-0 text-xl font-semibold text-gray-100">
                    Arrastre el archivo Excel aquí
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Solo archivos{" "}
                    <span className="text-green-400 font-bold">.xlsx</span> o{" "}
                    <span className="text-green-400 font-bold">.xls</span>
                  </p>
                </div>
              </div>
            }
          />
        </div>

        {erroresImportar.length > 0 && (
          <div className="mt-4">
            <div className="flex align-items-center gap-2 mb-2 text-red-400">
              <i className="pi pi-exclamation-circle" />
              <h4 className="m-0">Errores en el archivo</h4>
            </div>
            <DataTable
              value={erroresImportar}
              paginator
              rows={5}
              size="small"
              className="p-datatable-sm"
            >
              <Column field="fila" header="Fila" style={{ width: "4rem" }} />
              <Column field="campo" header="Campo" style={{ width: "8rem" }} />
              <Column field="mensaje" header="Descripción" />
            </DataTable>
          </div>
        )}
      </Dialog>
    </div>
  );
}
