import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Button } from "primereact/button";
import api from "../services/api";

interface ConteoAnulado {
  id: number;
  producto: string;
  codigo: number;
  subcodigo: number;
  cantidad: string;
  bodega: string;
  ubicacion: string;
  usuario_conteo: string;
  usuario_anulacion: string;
  motivo_anulacion: string;
  fecha_conteo: string;
  fecha_anulacion: string;
}

export default function ConteosAnulados() {
  const [data, setData] = useState<ConteoAnulado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/conteos-anulados");
      setData(res.data || []);
    } catch (error) {
      console.error("Error cargando conteos anulados:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (value: string) =>
    new Date(value).toLocaleString("es-CO");

  const exportarExcel = () => {
  const datos = data.map((row) => ({
    Producto: row.producto,
    Código: row.codigo,
    Subcódigo: row.subcodigo,
    Cantidad: Number(row.cantidad),
    Bodega: row.bodega,
    Ubicación: row.ubicacion,
    "Usuario conteo": row.usuario_conteo,
    "Usuario anulación": row.usuario_anulacion,
    "Motivo anulación": row.motivo_anulacion,
    "Fecha conteo": formatearFecha(row.fecha_conteo),
    "Fecha anulación": formatearFecha(row.fecha_anulacion),
  }));

  const worksheet = XLSX.utils.json_to_sheet(datos);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Conteos anulados");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `conteos_anulados_${Date.now()}.xlsx`);
};


  return (
    <div className="card">      
      <div className="flex justify-content-between align-items-center mb-3">
  <h3>Conteos anulados</h3>

  <Button
    label="Exportar a Excel"
    icon="pi pi-file-excel"
    className="p-button-success"
    onClick={exportarExcel}
    disabled={!data.length}
  />
</div>


      <DataTable
        value={data}
        loading={loading}
        paginator
        rows={15}
        stripedRows
        showGridlines
        emptyMessage="No hay conteos anulados"
      >
        <Column field="producto" header="Producto" />
        <Column field="bodega" header="Bodega" />
        <Column field="ubicacion" header="Ubicación" />
        <Column
          field="cantidad"
          header="Cantidad"
          body={(row) => Number(row.cantidad).toFixed(2)}
          style={{ textAlign: "right" }}
        />
        <Column field="usuario_conteo" header="Usuario conteo" />
        <Column field="usuario_anulacion" header="Anulado por" />
        <Column field="motivo_anulacion" header="Motivo" />
        <Column
          field="fecha_anulacion"
          header="Fecha anulación"
          body={(row) => formatearFecha(row.fecha_anulacion)}
        />
      </DataTable>
    </div>
  );
}
