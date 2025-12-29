import { useState, useEffect, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
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
    <div className="flex flex-column gap-2 ">
      {/* FILA 1: Título y Buscador (Más compacto) */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
        <div className="flex align-items-center gap-2">
          <i className="pi pi-chart-bar text-primary text-xl"></i>
          <h2 className="m-0 text-white text-lg md:text-xl font-semibold">
            Análisis Comparativo
          </h2>
        </div>

        <div className="flex flex-row align-items-center gap-2 w-full md:w-auto">
          <IconField iconPosition="left" className="flex-1 md:w-15rem">
            <InputIcon className="pi pi-search" />
            <InputText
              type="search"
              placeholder="Buscar..."
              className="w-full p-inputtext-sm"
              onInput={(e) =>
                setGlobalFilter((e.target as HTMLInputElement).value)
              }
            />
          </IconField>
          <Button
            icon="pi pi-file-excel"
            label="Excel"
            className="p-button-success p-button-sm px-3"
            onClick={exportarExcel}
            disabled={!datos.length}
          />
        </div>
      </div>

      {/* FILA 2: Controles de Selección (Layout Inteligente) */}
      <div className="flex flex-column lg:flex-row gap-2  border-gray-700">
        {/* Panel Izquierdo: Grupos */}
        <div className="flex-1 flex flex-column gap-1 kpi-card">
          <label className="text-xs font-bold text-blue-300 uppercase ml-1">
            <i className="pi pi-filter mr-1"></i> Grupos
          </label>
          <MultiSelect
            value={seleccionados}
            options={grupos}
            onChange={(e) => setSeleccionados(e.value)}
            optionLabel="descripcion"
            placeholder="Seleccionar..."
            display="chip"
            className="w-full p-multiselect-sm "
            maxSelectedLabels={1}
            selectedItemsLabel="{0} grupos seleccionados"
          />
        </div>

        {/* Panel Derecho: Cálculo (Solo si hay grupos) */}
        {seleccionados.length > 0 && (
          <div className="flex-1 flex flex-column gap-2 kpi-card">
            <label className="text-xs font-bold uppercase ml-1">
              <i className="pi pi-calculator mr-1"></i> Cálculo (A - B)
            </label>
            <div className="flex align-items-center gap-2">
              <Dropdown
                value={compararA}
                options={opcionesDiferencia}
                onChange={(e) => {
                  setCompararA(e.value);
                  setDatos([...datos]);
                }}
                placeholder="A"
                className="flex-1 p-inputtext-sm "
              />
              <span className="text-xs font-bold text-gray-500">vs</span>
              <Dropdown
                value={compararB}
                options={opcionesDiferencia}
                onChange={(e) => {
                  setCompararB(e.value);
                  setDatos([...datos]);
                }}
                placeholder="B"
                className="flex-1 p-inputtext-sm "
              />
            </div>
          </div>
        )}
      </div>

      {/* Indicador de comparación actual más sutil */}
      {compararA && compararB && (
        <div className="flex flex-row flex-wrap align-items-center gap-2 mb-3 px-3 py-2 kpi-card">
          <i className="pi pi-info-circle text-xs text-blue-400"></i>
          <small className="text-gray-400 mr-1">Análisis:</small>
          <Tag
            value={opcionesDiferencia.find((o) => o.value === compararA)?.label}
            severity="info"
            className="text-xs"
          />
          menos{" "}
          <Tag
            value={opcionesDiferencia.find((o) => o.value === compararB)?.label}
            severity="warning"
            className="text-xs"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="card">
      <DataTable
        value={datos}
        loading={loading}
        globalFilter={globalFilter}
        header={header}
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
    </div>
  );
}
