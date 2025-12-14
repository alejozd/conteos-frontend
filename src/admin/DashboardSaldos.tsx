// src/admin/DashboardSaldos.tsx
import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import api from "../services/api";

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


useEffect(() => {
  const cargarDatos = async () => {
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

  cargarDatos();
}, []);


  const diferenciaTemplate = (row: SaldoRow) => {
    const valor = Number(row.diferencia);

    let color = "#6c757d"; // gris
    if (valor > 0) color = "#198754"; // verde
    if (valor < 0) color = "#dc3545"; // rojo

    return (
      <span style={{ fontWeight: 600, color }}>
        {valor.toFixed(2)}
      </span>
    );
  };

  const header = (
    <div className="flex justify-content-between align-items-center">
      <h3 style={{ margin: 0 }}>Saldos vs Conteos</h3>
      <span className="p-input-icon-left">
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
      </DataTable>
    </div>
  );
}
