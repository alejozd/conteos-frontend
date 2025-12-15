// src/admin/DashboardSaldos.tsx
import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import DetalleConteosDialog from "./DetalleConteosDialog";
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
  const [productoSeleccionado, setProductoSeleccionado] = useState<SaldoRow | null>(null);



useEffect(() => {
  cargarDatos();
}, []);

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


  const diferenciaTemplate = (row: SaldoRow) => {
  const valor = Number(row.diferencia);

  let className = "diff-neutral";
  if (valor > 0) className = "diff-positive";
  if (valor < 0) className = "diff-negative";

  return <span className={className}>{valor.toFixed(2)}</span>;
};

  const header = (
  <div className="dashboard-header">
    <h3 className="dashboard-title">Saldos vs Conteos</h3>

    <span className="p-input-icon-left dashboard-search">
      <i className="pi pi-search" />
      <InputText
        placeholder="Buscar producto o referencia"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
      />
    </span>
  </div>
);


  return (
    <div className="card">
      <DataTable
        value={data}
        loading={loading}
        paginator
        rows={15}
        responsiveLayout="scroll"
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
  body={(row) => (
    <Button
      icon="pi pi-eye"
      className="p-button-text p-button-sm"
      onClick={() => {
        setProductoSeleccionado(row);
        setDetalleVisible(true);
      }}
    />
  )}
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
