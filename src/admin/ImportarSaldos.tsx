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
    { campo: "NOMBRE", requerido: true, desc: "Nombre del producto" },
    { campo: "REFERENCIA", requerido: true, desc: "Referencia opcional" },
  ],
  saldos: [
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
        {/* PASOS PARA IMPORTAR (Izquierda - Pulido) */}
        <div className="col-12 lg:col-5">
          <div className="card h-full p-4 border-left-3 border-primary bg-gray-900 shadow-4">
            <h3 className="mt-0 mb-4 text-xl font-semibold flex align-items-center gap-2">
              <i className="pi pi-list text-primary"></i>
              Pasos para importar
            </h3>
            <div className="flex flex-column gap-4">
              {[
                {
                  num: "1",
                  title: "Tipo de datos",
                  desc: "Seleccione si subirá productos o saldos.",
                },
                {
                  num: "2",
                  title: "Cargar Excel",
                  desc: "Seleccionar archivo o Arrastrar. Asegúrese que el archivo sea .xlsx o .xls ",
                },
                {
                  num: "3",
                  title: "Procesar",
                  desc: "Presione importar y revise los resultados.",
                },
              ].map((step, index) => (
                <div key={index} className="flex align-items-start gap-3">
                  <Tag
                    value={step.num}
                    rounded
                    severity="success"
                    className="shadow-2"
                    style={{ minWidth: "2rem", height: "2rem" }}
                  />
                  <div>
                    <span className="text-lg font-medium text-gray-100 block line-height-2">
                      {step.title}
                    </span>
                    <small className="text-gray-500">{step.desc}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNAS REQUERIDAS (Derecha - Modernizado) */}
        <div className="col-12 lg:col-7">
          <div
            className="card h-full p-4 bg-gray-900 border-none shadow-4 relative overflow-hidden"
            style={{ borderRadius: "8px" }}
          >
            {/* Decoración sutil de fondo */}
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <i className="pi pi-table text-8xl" />
            </div>

            <div className="flex justify-content-between align-items-center mb-3 border-bottom-1 border-gray-800 pb-2">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-database text-green-400 text-xl"></i>
                <h3 className="m-0 text-xl font-semibold text-gray-100">
                  Columnas requeridas
                </h3>
              </div>
              {tipo && (
                <Tag
                  value={tipo.toUpperCase()}
                  severity="success"
                  className="px-3"
                />
              )}
            </div>

            {!tipo ? (
              <div className="flex flex-column align-items-center justify-content-center h-full py-5 opacity-40">
                <i className="pi pi-mouse-pointer mb-3 text-4xl" />
                <span className="text-lg italic text-center">
                  Seleccione un tipo de importación <br /> para visualizar la
                  estructura
                </span>
              </div>
            ) : (
              <div className="flex flex-column h-full">
                {/* Grid de campos */}
                <div className="grid">
                  {GUIA_IMPORTACION[tipo].map((col) => (
                    <div key={col.campo} className="col-12 md:col-6 p-2">
                      <div className="p-2 bg-gray-800 border-round-lg border-left-3 border-green-500 hover:bg-gray-700 transition-colors transition-duration-200">
                        <div className="flex align-items-center justify-content-between mb-1">
                          <span className="text-green-400 font-bold text-sm tracking-wider">
                            {col.campo}
                          </span>
                          <i className="pi pi-check-circle text-xs text-gray-500"></i>
                        </div>
                        <span className="text-gray-300 text-xs block line-height-2">
                          {col.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Banner de advertencia corregido */}
                <div className="mt-3">
                  <div className="p-2 border-round-lg bg-orange-900-alpha-20 border-1 border-orange-800 flex align-items-center gap-3">
                    <i className="pi pi-exclamation-circle text-orange-400 text-lg" />
                    <span className="text-xs text-orange-100 font-medium uppercase tracking-wider">
                      Encabezados en MAYÚSCULAS y exactos
                    </span>
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
