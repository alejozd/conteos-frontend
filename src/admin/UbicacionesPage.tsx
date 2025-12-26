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
import { FileUpload, type FileUploadHandlerEvent } from "primereact/fileupload";
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

interface ErrorImportacion {
  fila: number;
  campo: string;
  mensaje: string;
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

  const [visibleImportar, setVisibleImportar] = useState(false);
  const [loadingImportar, setLoadingImportar] = useState(false);
  const [erroresImportar, setErroresImportar] = useState<ErrorImportacion[]>(
    []
  );
  const fileUploadRef = useRef<FileUpload>(null);

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

  const subirArchivoUbicaciones = async (event: FileUploadHandlerEvent) => {
    if (loadingImportar) return;

    const file: File = event.files[0];

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoadingImportar(true);
      setErroresImportar([]);

      const response = await api.post(
        "/api/admin/ubicaciones/importar",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      toast.current?.show({
        severity: "success",
        summary: "Importación finalizada",
        detail: `Total procesados: ${response.data.total}`,
        life: 6000,
      });

      event.options.clear();
      setVisibleImportar(false);
      cargarUbicaciones();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;

        if (data?.errores) {
          setErroresImportar(data.errores);
        }

        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data?.message || "Error al importar ubicaciones",
        });
      }
    } finally {
      setLoadingImportar(false);
    }
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
      {/* FILA SUPERIOR: Título y Botones de Acción */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
        <div className="flex align-items-center gap-3">
          <i className="pi pi-map-marker text-primary text-3xl" />
          <h3 className="m-0 text-xl font-semibold">Ubicaciones por Bodega</h3>
        </div>

        {/* Agrupamos los botones en un div para que estén juntos a la derecha */}
        <div className="flex gap-2">
          <Button
            label="Importar"
            icon="pi pi-upload"
            severity="secondary" // Color gris para diferenciarlo de la acción principal
            outlined // Estilo delineado para que no compita visualmente
            className="p-button-sm"
            disabled={!bodegaSel}
            onClick={() => {
              setErroresImportar([]);
              setVisibleImportar(true);
            }}
          />
          <Button
            label="Nueva Ubicación"
            icon="pi pi-plus"
            severity="success" // Verde para resaltar la creación
            disabled={!bodegaSel}
            className="p-button-sm shadow-1"
            onClick={nuevaUbicacion}
          />
        </div>
      </div>

      {/* FILA INFERIOR: Selectores y Filtros */}
      <div className="flex flex-column md:flex-row md:align-items-center gap-3 bg-gray-900 p-3 border-round border-1 border-gray-800">
        <div className="flex flex-column gap-1 flex-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Seleccionar Bodega
          </label>
          <Dropdown
            value={bodegaSel}
            options={bodegas}
            optionLabel="nombre"
            placeholder="Seleccione una bodega"
            onChange={(e) => setBodegaSel(e.value)}
            className="w-full md:w-20rem" // Reducido un poco para dar aire
            showClear
          />
        </div>

        <div className="flex flex-column gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
          <div className="flex flex-column gap-1">
            <label className="text-sm font-bold text-gray-400">Bodega</label>
            <InputText
              value={bodegaSel?.nombre || ""}
              disabled
              className="bg-gray-800"
            />
          </div>
          <div className="flex flex-column gap-1">
            <label htmlFor="nombre" className="font-medium text-900">
              Nombre
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
            label="Guardar"
            icon="pi pi-check"
            onClick={guardar}
            severity="success"
            disabled={!nombre.trim()}
          />
        </div>
      </Dialog>
      {/* DIALOGO DE IMPORTACIÓN */}
      <Dialog
        header="Importar Ubicaciones"
        visible={visibleImportar}
        onHide={() => setVisibleImportar(false)}
        draggable={false}
        resizable={false}
        style={{ width: "90vw", maxWidth: "600px" }}
      >
        {/* Aviso informativo actualizado */}
        <div className="p-2 mb-3 border-round bg-blue-900-alpha-10 border-left-3 border-blue-500 flex align-items-center gap-2">
          <i className="pi pi-info-circle text-blue-400" />
          <span className="text-sm">
            El sistema vinculará las ubicaciones a las bodegas indicadas en el
            archivo.
          </span>
        </div>

        <div className="field mb-3 mt-2">
          <FileUpload
            ref={fileUploadRef}
            name="file"
            mode="advanced"
            accept=".xlsx,.xls"
            maxFileSize={5000000}
            multiple={false}
            customUpload
            uploadHandler={subirArchivoUbicaciones}
            disabled={loadingImportar}
            chooseOptions={{
              label: "Seleccionar",
              icon: "pi pi-plus",
              className: "p-button-primary shadow-2",
            }}
            uploadOptions={{
              label: "Importar",
              icon: "pi pi-upload",
              className: "p-button-success shadow-2",
            }}
            cancelOptions={{
              label: "Limpiar",
              icon: "pi pi-times",
              className: "p-button-danger p-button-outlined",
            }}
            emptyTemplate={
              <div className="flex flex-column align-items-center">
                {/* Zona de Drop */}
                <div className="flex flex-column align-items-center py-3">
                  <i className="pi pi-file-excel text-5xl text-green-500 mb-3" />
                  <p className="m-0 text-xl font-semibold text-gray-100 text-center">
                    Arrastre el Excel aquí o haga clic
                  </p>
                </div>

                {/* Guía Visual de Estructura ACTUALIZADA */}
                <div
                  className="w-full mt-2 p-3 border-round-lg bg-gray-900 border-1 border-gray-800"
                  style={{ maxWidth: "450px" }}
                >
                  <div className="flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 border-gray-800">
                    <i className="pi pi-table text-blue-400" />
                    <span className="text-sm font-bold text-gray-300">
                      Estructura requerida (Encabezados en MAYÚSCULAS)
                    </span>
                  </div>

                  {/* Simulación de Tabla Excel con 2 Columnas */}
                  <div className="flex flex-column gap-1 mb-3">
                    <div className="flex gap-1">
                      <div className="bg-blue-900 border-1 border-blue-700 p-2 text-xs font-bold text-white flex-1 text-center border-round-top-left">
                        UBICACION
                      </div>
                      <div className="bg-blue-900 border-1 border-blue-700 p-2 text-xs font-bold text-white flex-1 text-center border-round-top-right">
                        BODEGA
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="bg-gray-800 border-1 border-gray-700 p-2 text-xs text-gray-300 flex-1 text-center border-round-bottom-left italic">
                        ESTANTE 1
                      </div>
                      <div className="bg-gray-800 border-1 border-gray-700 p-2 text-xs text-gray-300 flex-1 text-center border-round-bottom-right italic">
                        CENTRAL
                      </div>
                    </div>
                  </div>

                  {/* Tips de validación */}
                  <div className="flex flex-column gap-2 bg-gray-800-alpha-40 p-2 border-round">
                    <div className="flex align-items-center gap-2">
                      <i className="pi pi-check-circle text-green-500 text-xs" />
                      <span className="text-xs text-gray-400">
                        Ambas columnas son <b>obligatorias</b>.
                      </span>
                    </div>
                    <div className="flex align-items-center gap-2">
                      <i className="pi pi-exclamation-triangle text-orange-400 text-xs" />
                      <span className="text-xs text-gray-400 text-line-height-2">
                        El nombre de la bodega debe coincidir exactamente con
                        los registrados.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        </div>

        {/* Tabla de Errores */}
        {erroresImportar.length > 0 && (
          <div className="mt-4">
            <div className="flex align-items-center gap-2 mb-2 text-red-400">
              <i className="pi pi-exclamation-circle" />
              <h4 className="m-0">Errores detectados</h4>
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
