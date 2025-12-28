import { useState, useEffect, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button"; // Importar botón
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
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
  const [globalFilter, setGlobalFilter] = useState("");

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
      {/* FILA 1: Título y Acciones */}
      <div className="flex flex-column lg:flex-row lg:justify-content-between lg:align-items-center gap-3">
        <div className="flex align-items-center gap-2">
          <i className="pi pi-chart-bar text-primary text-2xl"></i>
          <h2 className="m-0 text-white text-xl">Análisis Comparativo</h2>
        </div>

        <div className="flex flex-column md:flex-row gap-2 w-full lg:w-auto">
          <IconField iconPosition="left" className="w-full md:w-20rem">
            <InputIcon className="pi pi-search" />
            <InputText
              type="search"
              placeholder="Buscar producto o referencia..."
              className="w-full p-inputtext-sm"
              onInput={(e) =>
                setGlobalFilter((e.target as HTMLInputElement).value)
              }
            />
          </IconField>

          <Button
            icon="pi pi-file-excel"
            label="Exportar"
            className="p-button-success p-button-sm w-full md:w-auto"
            onClick={exportarExcel}
            disabled={!datos.length}
          />
        </div>
      </div>

      {/* FILA 2: Panel de Filtros Responsivo */}
      <div className="flex flex-column lg:flex-row gap-3 bg-gray-800 p-3 border-round-xl border-1 border-gray-700 shadow-2">
        {/* Selector de Grupos */}
        <div className="flex-1 flex flex-column gap-2">
          <label className="text-xs font-bold text-blue-400 uppercase flex align-items-center gap-2">
            <i className="pi pi-filter-fill"></i> Grupos a comparar
          </label>
          <MultiSelect
            value={seleccionados}
            options={grupos}
            onChange={(e) => setSeleccionados(e.value)}
            optionLabel="descripcion"
            placeholder="Seleccionar conteos..."
            display="chip"
            className="w-full p-multiselect-sm"
            maxSelectedLabels={1}
          />
        </div>

        {/* Separador solo visible en escritorio */}
        {seleccionados.length > 0 && (
          <div className="hidden lg:block border-left-1 border-gray-700 mx-2"></div>
        )}

        {/* Selector de Diferencia - CORREGIDO PARA MÓVIL */}
        {seleccionados.length > 0 && (
          <div className="flex-1 flex flex-column gap-2">
            <label className="text-xs font-bold text-orange-400 uppercase flex align-items-center gap-2">
              <i className="pi pi-calculator"></i> Configurar Cálculo (A - B)
            </label>
            {/* Cambiamos a flex-column en móvil y flex-row en tablets/pc */}
            <div className="flex flex-column sm:flex-row align-items-center gap-2 w-full">
              <Dropdown
                value={compararA}
                options={opcionesDiferencia}
                onChange={(e) => {
                  setCompararA(e.value);
                  setDatos([...datos]);
                }}
                placeholder="Valor A"
                className="w-full sm:flex-1 p-inputtext-sm"
              />
              {/* El "VS" se oculta en móvil o se centra mejor */}
              <span className="font-bold text-gray-600 text-xs sm:px-1">
                vs
              </span>
              <Dropdown
                value={compararB}
                options={opcionesDiferencia}
                onChange={(e) => {
                  setCompararB(e.value);
                  setDatos([...datos]);
                }}
                placeholder="Valor B"
                className="w-full sm:flex-1 p-inputtext-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="comparativa-container p-2 md:p-4 bg-black-alpha-90 min-h-screen">
      <Card
        header={header}
        className="bg-gray-900 border-none shadow-8 overflow-hidden"
      >
        {/* Indicador de comparación actual más sutil */}
        {compararA && compararB && (
          <div className="flex flex-row flex-wrap align-items-center gap-2 mb-3 px-3 py-2 border-left-3 border-blue-500 bg-gray-800 border-round-right">
            <small className="text-gray-400 mr-1">Análisis:</small>
            <Tag
              value={
                opcionesDiferencia.find((o) => o.value === compararA)?.label
              }
              severity="info"
              className="text-xs"
            />
            <i className="pi pi-arrows-h text-gray-600 text-xs"></i>
            <Tag
              value={
                opcionesDiferencia.find((o) => o.value === compararB)?.label
              }
              severity="warning"
              className="text-xs"
            />
          </div>
        )}
        <DataTable
          value={datos}
          loading={loading}
          globalFilter={globalFilter}
          emptyMessage="Selecciona al menos un grupo para comparar."
          stripedRows
          size="small"
          paginator
          rows={20}
          rowsPerPageOptions={[20, 50, 100]}
          scrollable
          // scrollHeight="calc(100vh - 380px)"
          tableStyle={{ minWidth: "50rem" }}
          className="custom-datatable mt-2"
        >
          <Column
            field="referencia"
            header="Referencia"
            sortable
            frozen
            style={{ width: "140px" }}
            className="font-bold"
          />
          <Column
            field="nombre"
            header="Producto"
            sortable
            frozen
            style={{ width: "280px" }}
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
