// src/admin/DashboardSaldos.tsx
// src/admin/DashboardSaldos.tsx
import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Badge } from "primereact/badge";
import DetalleConteosDialog from "./DetalleConteosDialog";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import api from "../services/api";
import "../styles/DashboardSaldos.css";

interface SaldoRow {
  codigo: number;
  subcodigo: number;
  nombre: string;
  referencia: string;
  saldo_sistema: string;
  conteo_total: string;
  diferencia: string;
}

export default function DashboardSaldos() {
  const [data, setData] = useState<SaldoRow[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<SaldoRow | null>(null);
  const [soloConDiferencia, setSoloConDiferencia] = useState(false);

  useEffect(() => {
    cargarDatos();

    const interval = setInterval(() => {
      if (!detalleVisible) {
        cargarDatos();
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [detalleVisible]);

  const cargarDatos = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/saldos-resumen");
      setData(res.data || []);
    } catch (error) {
      console.error("Error cargando saldos:", error);
    } finally {
      setLoading(false);
    }
  };

  const dataFiltrada = soloConDiferencia
    ? data.filter((r) => Number(r.diferencia) !== 0)
    : data;

  const diferenciaTemplate = (row: SaldoRow) => {
    const valor = Number(row.diferencia);

    let className = "diff-neutral";
    if (valor > 0) className = "diff-positive";
    if (valor < 0) className = "diff-negative";

    return <span className={className}>{valor.toFixed(2)}</span>;
  };

  const toggleSoloConDiferencia = () => {
    setLoading(true);

    setTimeout(() => {
      setSoloConDiferencia((prev) => !prev);
      setLoading(false);
    }, 200);
  };

  const exportarExcel = () => {
    const rows = dataFiltrada.map((r) => ({
      Producto: r.nombre,
      Referencia: r.referencia,
      "Saldo sistema": Number(r.saldo_sistema),
      Conteo: Number(r.conteo_total),
      Diferencia: Number(r.diferencia),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Saldos");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(
      blob,
      `saldos_conteos_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Calculamos la cantidad de productos con diferencia para el Badge
  const totalDiferencias = data.filter(
    (r) => Number(r.diferencia) !== 0
  ).length;

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
      {/* Título con Badge de estado */}
      <div className="flex align-items-center gap-2">
        <h3 className="m-0 dashboard-title">Saldos vs Conteos</h3>
        {totalDiferencias > 0 && (
          <Badge
            value={totalDiferencias}
            severity="danger"
            title="Productos con discrepancias"
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2 align-items-center">
        {/* Grupo de Filtro y Exportación */}
        <div className="flex gap-2">
          <Button
            label={soloConDiferencia ? "Mostrar todos" : "Solo diferencias"}
            icon={soloConDiferencia ? "pi pi-filter-slash" : "pi pi-filter"}
            className={`p-button-sm ${
              soloConDiferencia ? "p-button-info" : "p-button-outlined"
            }`}
            onClick={toggleSoloConDiferencia}
          />

          <Button
            label="Excel"
            icon="pi pi-file-excel"
            className="p-button-sm p-button-success p-button-outlined"
            onClick={exportarExcel}
            tooltip="Exportar datos actuales"
          />
        </div>

        {/* Buscador con ancho controlado */}
        <IconField iconPosition="left">
          <InputIcon className="pi pi-search" />
          <InputText
            placeholder="Buscar..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="p-inputtext-sm w-full md:w-14rem"
          />
        </IconField>
      </div>
    </div>
  );

  return (
    <div className="card">
      <DataTable
        value={dataFiltrada}
        loading={loading}
        paginator
        rows={15}
        globalFilter={globalFilter}
        header={header}
        emptyMessage="No hay datos para mostrar"
        stripedRows
        showGridlines
      >
        <Column field="nombre" header="Producto" sortable />
        <Column field="referencia" header="Referencia" sortable />
        <Column
          field="saldo_sistema"
          header="Saldo sistema"
          sortable
          body={(row) => Number(row.saldo_sistema).toFixed(2)}
          style={{ textAlign: "right" }}
        />
        <Column
          field="conteo_total"
          header="Conteo"
          sortable
          body={(row) => Number(row.conteo_total).toFixed(2)}
          style={{ textAlign: "right" }}
        />
        <Column
          header="Diferencia"
          body={diferenciaTemplate}
          sortable
          style={{ textAlign: "right" }}
        />
        <Column
          header="Detalle"
          body={(row: SaldoRow) => {
            const tieneDetalle = Number(row.conteo_total) > 0;

            return (
              <Button
                icon="pi pi-eye"
                className="p-button-text p-button-sm"
                disabled={!tieneDetalle}
                tooltip={
                  tieneDetalle
                    ? "Ver detalle de conteos"
                    : "Este producto no tiene conteos registrados"
                }
                tooltipOptions={{ position: "top" }}
                onClick={() => {
                  if (!tieneDetalle) return;

                  setProductoSeleccionado(row);
                  setDetalleVisible(true);
                }}
              />
            );
          }}
        />
      </DataTable>
      {productoSeleccionado && (
        <DetalleConteosDialog
          visible={detalleVisible}
          onHide={() => setDetalleVisible(false)}
          codigo={productoSeleccionado.codigo}
          subcodigo={productoSeleccionado.subcodigo}
          nombre={productoSeleccionado.nombre}
          onConteoAnulado={cargarDatos}
        />
      )}
    </div>
  );
}
