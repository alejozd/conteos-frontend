import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { MultiSelect } from "primereact/multiselect";
import { Card } from "primereact/card";
import api from "../services/api";

interface Grupo {
  id: number;
  descripcion: string;
}

export default function ComparativaConteos() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [seleccionados, setSeleccionados] = useState<Grupo[]>([]);
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Cargar los grupos disponibles para el selector
  useEffect(() => {
    api.get("/api/admin/conteos-grupos").then((res) => setGrupos(res.data));
  }, []);

  // 2. Cargar datos cuando cambie la selección
  useEffect(() => {
    if (seleccionados.length > 0) {
      consultarComparativa();
    } else {
      setDatos([]);
    }
  }, [seleccionados]);

  const consultarComparativa = async () => {
    setLoading(true);
    try {
      const ids = seleccionados.map((g) => g.id).join(",");
      const res = await api.get(`/api/admin/comparativa-conteos?ids=${ids}`);
      setDatos(res.data);
    } catch (error) {
      console.error("Error cargando comparativa", error);
    } finally {
      setLoading(false);
    }
  };

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
      <h2 className="m-0 text-white">Análisis Comparativo</h2>
      <MultiSelect
        value={seleccionados}
        options={grupos}
        onChange={(e) => setSeleccionados(e.value)}
        optionLabel="descripcion"
        placeholder="Seleccionar Conteos a Comparar"
        display="chip"
        className="w-full md:w-30rem"
      />
    </div>
  );

  return (
    <div className="comparativa-container">
      <Card header={header} className="bg-gray-900 border-none shadow-4">
        <DataTable
          value={datos}
          loading={loading}
          emptyMessage="Selecciona al menos un grupo de conteo para comparar."
          stripedRows
          size="small"
          scrollable
          scrollHeight={"800px"}
          virtualScrollerOptions={{ itemSize: 46 }}
        >
          <Column field="referencia" header="Referencia" sortable />
          <Column field="nombre" header="Producto" sortable />
          <Column
            field="saldo_sistema"
            header="Saldo ERP"
            body={(row) => Number(row.saldo_sistema).toFixed(2)}
            style={{ fontWeight: "bold" }}
          />

          {/* COLUMNAS DINÁMICAS BASADAS EN LA SELECCIÓN */}
          {seleccionados.map((grupo) => (
            <Column
              key={grupo.id}
              header={grupo.descripcion}
              body={(row) => {
                const valor = row[`c_${grupo.id}`] || 0;
                return Number(valor).toFixed(2);
              }}
              sortable
            />
          ))}
        </DataTable>
      </Card>
    </div>
  );
}
