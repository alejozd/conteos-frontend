import React, { useState, useEffect, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import api from "../services/api";

interface Grupo {
  id: number;
  descripcion: string;
}

interface ProductoComparativo {
  codigo: number;
  subcodigo: number;
  nombre: string;
  referencia: string;
  saldo_sistema: string | number;
  // Index Signature: permite cualquier propiedad que empiece con "c_" seguida de un ID
  [key: string]: string | number;
}

export default function ComparativaConteos() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [seleccionados, setSeleccionados] = useState<Grupo[]>([]);
  const [datos, setDatos] = useState<ProductoComparativo[]>([]);
  const [loading, setLoading] = useState(false);
  const [compararA, setCompararA] = useState<number | "erp" | null>(null);
  const [compararB, setCompararB] = useState<number | "erp" | null>(null);

  useEffect(() => {
    api.get("/api/admin/conteos-grupos").then((res) => setGrupos(res.data));
  }, []);

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

  // Efecto para sugerir una comparación automática al elegir conteos
  useEffect(() => {
    if (seleccionados.length >= 2) {
      setCompararA(seleccionados[seleccionados.length - 1].id); // El último
      setCompararB(seleccionados[seleccionados.length - 2].id); // El penúltimo
    } else if (seleccionados.length === 1) {
      setCompararA(seleccionados[0].id);
      setCompararB("erp");
    }
  }, [seleccionados]);

  // Función para calcular la diferencia entre los dos últimos conteos seleccionados
  const calcularDiferencia = useCallback(
    (row: ProductoComparativo): number => {
      if (compararA === null || compararB === null) return 0;

      const valA =
        compararA === "erp"
          ? Number(row.saldo_sistema || 0)
          : Number(row[`c_${compararA}`] || 0);

      const valB =
        compararB === "erp"
          ? Number(row.saldo_sistema || 0)
          : Number(row[`c_${compararB}`] || 0);

      return valA - valB;
    },
    [compararA, compararB]
  );

  const opcionesDiferencia = [
    { label: "Saldo ERP", value: "erp" },
    ...seleccionados.map((s) => ({ label: s.descripcion, value: s.id })),
  ];

  const header = (
    <div className="flex flex-column gap-3">
      <div className="flex justify-content-between align-items-center">
        <h2 className="m-0 text-white">Análisis Comparativo</h2>
        <MultiSelect
          value={seleccionados}
          options={grupos}
          onChange={(e) => setSeleccionados(e.value)}
          optionLabel="descripcion"
          placeholder="Seleccionar Conteos"
          display="chip"
          className="w-full md:w-30rem"
        />
      </div>

      {seleccionados.length > 0 && (
        <div className="flex align-items-center gap-2 bg-gray-800 p-2 border-round">
          <span className="text-sm font-bold">Calcular Diferencia:</span>
          <Dropdown
            value={compararA}
            options={opcionesDiferencia}
            onChange={(e) => {
              setCompararA(e.value);
              setDatos([...datos]); // Forzamos a DataTable a ver un "nuevo" array
            }}
            placeholder="Seleccionar A"
            className="p-inputtext-sm"
          />
          <Dropdown
            value={compararB}
            options={opcionesDiferencia}
            onChange={(e) => {
              setCompararB(e.value);
              setDatos([...datos]); // Forzamos a DataTable a ver un "nuevo" array
            }}
            placeholder="Seleccionar B"
            className="p-inputtext-sm"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="comparativa-container p-3">
      <Card header={header} className="bg-gray-900 border-none shadow-4">
        {compararA && compararB && (
          <div className="mb-2 text-sm text-gray-400">
            Mostrando:{" "}
            <b className="text-white">
              {opcionesDiferencia.find((o) => o.value === compararA)?.label}
            </b>
            menos
            <b className="text-white">
              {" "}
              {opcionesDiferencia.find((o) => o.value === compararB)?.label}
            </b>
          </div>
        )}
        <DataTable
          value={datos}
          loading={loading}
          emptyMessage="Selecciona al menos un grupo para comparar."
          stripedRows
          size="small"
          // --- MEJORA DE NAVEGACIÓN ---
          paginator
          rows={20}
          rowsPerPageOptions={[20, 50, 100]}
          // ----------------------------
          scrollable
          scrollHeight="600px"
          tableStyle={{ minWidth: "50rem" }}
        >
          <Column
            field="referencia"
            header="Referencia"
            sortable
            frozen
            style={{ width: "150px" }}
          />
          <Column
            field="nombre"
            header="Producto"
            sortable
            frozen
            style={{ width: "250px" }}
          />

          <Column
            field="saldo_sistema"
            header="Saldo ERP"
            body={(row) => (
              <span className="text-blue-400 font-bold">
                {Number(row.saldo_sistema).toFixed(2)}
              </span>
            )}
            sortable
          />

          {/* COLUMNAS DINÁMICAS */}
          {seleccionados.map((grupo) => (
            <Column
              key={grupo.id}
              header={grupo.descripcion}
              body={(row) => Number(row[`c_${grupo.id}`] || 0).toFixed(2)}
              sortable
            />
          ))}

          {/* COLUMNA DE DIFERENCIA AUTOMÁTICA */}
          {seleccionados.length > 0 && (
            <Column
              // Esta key es vital, pero asegúrate de que use los valores actuales
              key={`dif-col-${compararA}-${compararB}`}
              header="Dif. Comparativa"
              // Engañamos al sorting para que sepa que esta columna depende de estos valores
              field={`diff_${compararA}_${compararB}`}
              body={(row: ProductoComparativo) => {
                const dif = calcularDiferencia(row);
                return (
                  <Tag
                    severity={dif === 0 ? "success" : "danger"}
                    value={dif.toFixed(2)}
                    style={{ fontSize: "1rem" }}
                  />
                );
              }}
              sortable
            />
          )}
        </DataTable>
      </Card>
    </div>
  );
}
