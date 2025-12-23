import { useRef, useState } from "react";
import api from "../services/api";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { FileUpload, type FileUploadHandlerEvent } from "primereact/fileupload";
import { isAxiosError } from "axios";

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

      <h2 className="mb-4">Importar información</h2>

      <div className="card p-3">
        <div className="flex align-items-center gap-2 mb-2">
          <span className="p-tag p-tag-rounded">1</span>
          <span>Seleccione el tipo de importación</span>
        </div>
        <div className="flex align-items-center gap-2 mb-2">
          <span className="p-tag p-tag-rounded">2</span>
          <span>Seleccione o arrastre el archivo Excel</span>
        </div>
        <div className="flex align-items-center gap-2">
          <span className="p-tag p-tag-rounded">3</span>
          <span>Presione Importar y espere el resultado</span>
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
            emptyTemplate={
              <div className="flex flex-column align-items-center">
                <i className="pi pi-cloud-upload text-3xl mb-3" />
                <p className="m-0 text-center">
                  Arrastre el archivo Excel aquí
                  <br />o haga clic para seleccionarlo
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
