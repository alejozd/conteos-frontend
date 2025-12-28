import { useState, useEffect, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button"; // Importar botón
import * as XLSX from "xlsx"; // Importar para Excel
import { saveAs } from "file-saver";
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
  [key: string]: string | number;
}

interface ExcelRow {
  Referencia: string;
  Producto: string;
  "Saldo ERP": number;
  [key: string]: string | number; // Esto permite las columnas de conteos y la diferencia
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

  const exportarExcel = () => {
    const excelData: ExcelRow[] = datos.map((row) => {
      // 1. Columnas Base con tipo estricto
      const item: ExcelRow = {
        Referencia: row.referencia,
        Producto: row.nombre,
        "Saldo ERP": Number(row.saldo_sistema),
      };

      // 2. Agregar columnas de conteos seleccionados
      seleccionados.forEach((g) => {
        item[g.descripcion] = Number(row[`c_${g.id}`] || 0);
      });

      // 3. Agregar Diferencia actual con etiqueta dinámica
      const labelA =
        compararA === "erp"
          ? "Saldo ERP"
          : seleccionados.find((s) => s.id === compararA)?.descripcion;
      const labelB =
        compararB === "erp"
          ? "Saldo ERP"
          : seleccionados.find((s) => s.id === compararB)?.descripcion;

      const columnaDif = `Diferencia (${labelA} - ${labelB})`;
      item[columnaDif] = calcularDiferencia(row);

      return item;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Comparativa");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Comparativa_Conteos_${Date.now()}.xlsx`);
  };

  const opcionesDiferencia = [
    { label: "Saldo ERP", value: "erp" },
    ...seleccionados.map((s) => ({ label: s.descripcion, value: s.id })),
  ];

  const header = (
    <div className="flex flex-column gap-3">
      {/* FILA 1: Título y Botón Excel */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
        <h2 className="m-0 text-white text-xl md:text-2xl">
          Análisis Comparativo
        </h2>
        <Button
          icon="pi pi-file-excel"
          label="Excel"
          className="p-button-success p-button-sm p-button-outlined w-full md:w-auto"
          onClick={exportarExcel}
          disabled={!datos.length}
        />
      </div>

      {/* FILA 2: Selector de Conteos (MultiSelect) */}
      <div className="flex flex-column gap-2">
        <label className="text-xs text-gray-400 font-bold ml-1 uppercase">
          Seleccionar Grupos:
        </label>
        <MultiSelect
          value={seleccionados}
          options={grupos}
          onChange={(e) => setSeleccionados(e.value)}
          optionLabel="descripcion"
          placeholder="Elegir conteos para comparar..."
          display="chip"
          className="w-full"
          maxSelectedLabels={3}
        />
      </div>

      {/* FILA 3: Controles de Diferencia */}
      {seleccionados.length > 0 && (
        <div className="flex flex-column gap-2 bg-gray-800 p-3 border-round shadow-2">
          <span className="text-xs font-bold text-primary uppercase">
            Configurar Comparación:
          </span>
          <div className="flex flex-column md:flex-row align-items-center gap-2">
            <div className="flex align-items-center gap-2 w-full md:w-auto flex-1">
              <span className="text-sm text-gray-400 hidden md:inline">A:</span>
              <Dropdown
                value={compararA}
                options={opcionesDiferencia}
                onChange={(e) => {
                  setCompararA(e.value);
                  setDatos([...datos]);
                }}
                placeholder="Seleccionar A"
                className="p-inputtext-sm w-full"
              />
            </div>

            <span className="font-bold text-gray-500 mx-1 md:block">vs</span>

            <div className="flex align-items-center gap-2 w-full md:w-auto flex-1">
              <span className="text-sm text-gray-400 hidden md:inline">B:</span>
              <Dropdown
                value={compararB}
                options={opcionesDiferencia}
                onChange={(e) => {
                  setCompararB(e.value);
                  setDatos([...datos]);
                }}
                placeholder="Seleccionar B"
                className="p-inputtext-sm w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="comparativa-container p-3">
      <Card header={header} className="bg-gray-900 border-none shadow-4">
        {compararA && compararB && (
          <div className="mb-3 px-3 py-2 text-sm text-gray-300 bg-bluegray-900 border-left-3 border-blue-500 border-round-right shadow-1 w-full flex align-items-center gap-2">
            <i className="pi pi-info-circle text-blue-400"></i>
            <span>
              Análisis de:{" "}
              <b className="text-blue-400">
                {opcionesDiferencia.find((o) => o.value === compararA)?.label}
              </b>
              <span className="mx-2 text-gray-600">|</span>
              Base:{" "}
              <b className="text-orange-400">
                {opcionesDiferencia.find((o) => o.value === compararB)?.label}
              </b>
            </span>
          </div>
        )}
        <DataTable
          value={datos}
          loading={loading}
          emptyMessage="Selecciona al menos un grupo para comparar."
          stripedRows
          size="small"
          paginator
          rows={20}
          rowsPerPageOptions={[20, 50, 100]}
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

          {seleccionados.map((grupo) => (
            <Column
              key={grupo.id}
              header={grupo.descripcion}
              body={(row) => Number(row[`c_${grupo.id}`] || 0).toFixed(2)}
              sortable
            />
          ))}

          {seleccionados.length > 0 && (
            <Column
              key={`dif-col-${compararA}-${compararB}`}
              header="Dif. Comparativa"
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
