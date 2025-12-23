import { useRef, useState } from "react";
import api from "../services/api";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { FileUpload, type FileUploadSelectEvent } from "primereact/fileupload";
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

  const [tipo, setTipo] = useState<TipoImportacion | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<ErrorImportacion[]>([]);
  const fileUploadRef = useRef<FileUpload>(null);

  const handleImportar = async () => {
    if (!tipo || !archivo) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Debe seleccionar el tipo y el archivo Excel",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", archivo);

    const url =
      tipo === "productos"
        ? "/api/admin/productos/importar"
        : "/api/admin/saldos/importar";

    try {
      setLoading(true);
      setErrores([]);

      const response = await api.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.current?.show({
        severity: "success",
        summary: "Importación exitosa",
        detail: `Registros importados: ${response.data.total}`,
      });

      setArchivo(null);
setTipo(null);
fileUploadRef.current?.clear();
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

        <div className="field mb-4">
  <label htmlFor="archivoExcel" className="block mb-2">
    Archivo Excel
  </label>

  <FileUpload
    ref={fileUploadRef}
    id="archivoExcel"
    mode="advanced"
    name="file"
    accept=".xlsx,.xls"
    maxFileSize={5_000_000}
    chooseLabel="Seleccionar archivo"
    uploadLabel="Subir"
    cancelLabel="Cancelar"
    customUpload
    auto={false}    
    onSelect={(e: FileUploadSelectEvent) =>
      setArchivo(e.files[0] ?? null)
    }
    className="w-full"
    emptyTemplate={
      <p className="m-0 text-center">
        Arrastre el archivo aquí o haga clic para seleccionarlo
      </p>
    }
  />
</div>


        <Button
  label="Importar"
  icon="pi pi-upload"
  onClick={handleImportar}
  loading={loading}
  disabled={!tipo || !archivo}
  className="w-full"
/>
      </div>

      {errores.length > 0 && (
        <div className="mt-5">
          <h3>Errores encontrados</h3>
          <DataTable
            value={errores}
            paginator
            rows={10}
            responsiveLayout="scroll"
          >
            <Column field="fila" header="Fila" />
            <Column field="campo" header="Campo" />
            <Column field="mensaje" header="Descripción" />
          </DataTable>
        </div>
      )}
    </div>
  );
}
