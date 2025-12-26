import { useRef, useState } from "react";
import api from "../services/api";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { FileUpload, type FileUploadHandlerEvent } from "primereact/fileupload";
import { isAxiosError } from "axios";
import { Tag } from "primereact/tag";

interface ErrorImportacion {
  fila: number;
  campo: string;
  mensaje: string;
}

type TipoImportacion = "productos" | "saldos";

const TIPOS_IMPORTACION: { label: string; value: TipoImportacion }[] = [
  { label: "Productos", value: "productos" },
  { label: "Saldos", value: "saldos" },
];

const GUIA_IMPORTACION = {
  productos: [
    { campo: "CODIGO", requerido: true, desc: "Código del producto" },
    { campo: "SUBCODIGO", requerido: true, desc: "Subcódigo del producto" },
    { campo: "NOMBRE", requerido: true, desc: "Nombre del producto" },
    { campo: "REFERENCIA", requerido: true, desc: "Referencia opcional" },
  ],
  saldos: [
    { campo: "CODIGO", requerido: true, desc: "Código del producto" },
    { campo: "SUBCODIGO", requerido: true, desc: "Subcódigo del producto" },
    { campo: "REFERENCIA", requerido: true, desc: "Referencia opcional" },
    { campo: "SALDO", requerido: true, desc: "Cantidad numérica" },
  ],
};

export default function ImportarSaldos() {
  const toast = useRef<Toast>(null);
  const fileUploadRef = useRef<FileUpload>(null);

  const [tipo, setTipo] = useState<TipoImportacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<ErrorImportacion[]>([]);

  const subirArchivo = async (event: FileUploadHandlerEvent) => {
    if (!tipo) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar el tipo de importación",
      });
      event.options.clear();
      return;
    }

    const file: File = event.files[0];

    const formData = new FormData();
    formData.append("file", file);

    const url =
      tipo === "productos"
        ? "/api/admin/productos/importar"
        : "/api/admin/saldos/importar";

    try {
      setLoading(true);
      setErrores([]);

      const response = await api.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.current?.show({
        severity: "success",
        summary: "Importación finalizada",
        detail: `Total procesados: ${response.data.total}`,
        life: 6000,
      });

      event.options.clear(); // cambia a Completed
      setTipo(null);
      setErrores([]);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const data = error.response?.data;

        if (data?.errores) {
          setErrores(data.errores);
        }

        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data?.message || "Error al importar el archivo",
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error inesperado al importar",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3">
      <Toast ref={toast} />

      <div className="flex align-items-center mb-4">
        <i className="pi pi-file-import text-primary text-4xl mr-3" />
        <h1 className="m-0 text-3xl font-bold tracking-tight">
          Importar Información
        </h1>
      </div>

      {/* SECCIÓN SUPERIOR: INSTRUCCIONES + GUÍA */}
      <div className="grid mt-2">
        {/* PASOS PARA IMPORTAR */}
        <div className="col-12 lg:col-5">
          <div className="card h-full p-4 border-left-3 border-primary bg-gray-900 shadow-4">
            <h3 className="mt-0 mb-4 text-xl font-semibold border-bottom-1 border-gray-800 pb-2">
              Pasos para importar
            </h3>
            <div className="flex flex-column gap-4">
              <div className="flex align-items-start gap-3">
                <Tag value="1" rounded severity={"success"} />
                <div>
                  <span className="text-xl font-medium text-gray-100 block">
                    Tipo de datos
                  </span>
                  <small className="text-gray-400">
                    Seleccione si subirá productos o saldos.
                  </small>
                </div>
              </div>
              <div className="flex align-items-start gap-3">
                <Tag value="2" rounded severity={"success"} />
                <div>
                  <span className="text-xl font-medium text-gray-100 block">
                    Cargar Excel
                  </span>
                  <small className="text-gray-400">
                    Asegúrese que el archivo sea .xlsx o .xls
                  </small>
                </div>
              </div>
              <div className="flex align-items-start gap-3">
                <Tag value="3" rounded severity={"success"} />
                <div>
                  <span className="text-xl font-medium text-gray-100 block">
                    Procesar
                  </span>
                  <small className="text-gray-400">
                    Presione importar y revise los resultados.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNAS REQUERIDAS */}
        <div className="col-12 lg:col-7">
          <div className="card h-full p-4 bg-gray-900 border-gray-800 border-1 shadow-4">
            <div className="flex justify-content-between align-items-center mb-3 border-bottom-1 border-gray-800 pb-2">
              <h3 className="m-0 text-xl font-semibold text-green-400">
                Columnas requeridas
              </h3>
              {tipo && <Tag value={tipo.toUpperCase()} severity="success" />}
            </div>

            {!tipo ? (
              <div className="flex flex-column align-items-center justify-content-center h-full ">
                <i className="pi pi-info-circle mb-2 text-3xl opacity-50" />
                <span className="text-lg">
                  Seleccione un tipo para ver los campos
                </span>
              </div>
            ) : (
              <div className="grid">
                <div className="col-12 flex flex-wrap gap-2 mb-1">
                  {GUIA_IMPORTACION[tipo].map((col) => (
                    <Tag
                      key={col.campo}
                      value={col.campo}
                      severity={col.requerido ? "danger" : "info"}
                      className="px-2 py-1 shadow-2 font-bold"
                    />
                  ))}
                </div>
                <div className="col-12">
                  <div className="grid row-gap-1">
                    {GUIA_IMPORTACION[tipo].map((col) => (
                      <div
                        key={col.campo}
                        className="col-12 md:col-6 flex flex-column"
                      >
                        <span className="text-gray-200 font-bold text-sm">
                          {col.campo}
                        </span>
                        <span className="text-gray-400 text-sm italic">
                          {col.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-12 mt-4">
                  <div>
                    <p className="m-0 text-sm text-orange-200 font-bold uppercase">
                      <i className="pi pi-exclamation-triangle mr-2" />
                      Encabezados en MAYÚSCULAS y exactos.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-3">
        {/* Tipo de importación */}
        <div className="field mb-3">
          <label htmlFor="tipoImportacion" className="block mb-2">
            Tipo de importación
          </label>
          <Dropdown
            id="tipoImportacion"
            value={tipo}
            options={TIPOS_IMPORTACION}
            onChange={(e) => setTipo(e.value)}
            placeholder="Seleccione una opción"
            className="w-full"
          />
        </div>

        {/* Archivo */}
        <div className="field mb-4">
          <label className="block mb-2">Archivo Excel</label>

          <FileUpload
            ref={fileUploadRef}
            name="file"
            mode="advanced"
            accept=".xlsx,.xls"
            maxFileSize={5_000_000}
            multiple={false}
            chooseLabel={loading ? "Procesando..." : "Seleccionar archivo"}
            uploadLabel={loading ? "Importando..." : "Importar"}
            cancelLabel="Cancelar"
            customUpload
            uploadHandler={subirArchivo}
            disabled={!tipo || loading}
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
              <div className="flex flex-column align-items-center gap-2">
                <i className="pi pi-file-excel text-5xl text-green-500" />
                <p className="m-0 text-center">
                  Arrastre el archivo Excel aquí
                  <br />o haga clic para seleccionarlo
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Solo archivos{" "}
                  <span className="text-green-400 font-bold">.xlsx</span> o{" "}
                  <span className="text-green-400 font-bold">.xls</span>
                </p>
              </div>
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Tabla de errores */}
      {errores.length > 0 && (
        <div className="mt-5">
          <h3>Errores encontrados</h3>
          <DataTable value={errores} paginator rows={10}>
            <Column field="fila" header="Fila" />
            <Column field="campo" header="Campo" />
            <Column field="mensaje" header="Descripción" />
          </DataTable>
        </div>
      )}
    </div>
  );
}
