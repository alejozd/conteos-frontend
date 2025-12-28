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
import { Dropdown, type DropdownProps } from "primereact/dropdown";
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

interface ConteoGrupo {
  id: number;
  fecha: string;
  descripcion: string;
  activo: number;
}

export default function DashboardSaldos() {
  const [data, setData] = useState<SaldoRow[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<SaldoRow | null>(null);
  const [soloConDiferencia, setSoloConDiferencia] = useState(false);
  const [grupos, setGrupos] = useState<ConteoGrupo[]>([]);
  const [grupoSeleccionado, setGrupoSeleccionado] =
    useState<ConteoGrupo | null>(null);

  useEffect(() => {
    const cargarGrupos = async () => {
      try {
        const res = await api.get("/api/admin/conteos-grupos");
        const data = res.data || [];
        setGrupos(data);

        // LÓGICA DE SELECCIÓN INTELIGENTE
        if (data.length > 0) {
          // Buscamos el que tenga activo === 1
          const grupoActivo = data.find((g: ConteoGrupo) => g.activo === 1);

          // Si hay uno activo lo seleccionamos, si no, tomamos el primero por defecto
          setGrupoSeleccionado(grupoActivo || data[0]);
        }
      } catch (error) {
        console.error("Error cargando grupos:", error);
      }
    };

    cargarGrupos();
  }, []);

  useEffect(() => {
    if (!grupoSeleccionado) return;

    cargarDatos();

    const interval = setInterval(() => {
      if (!detalleVisible) {
        cargarDatos();
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [detalleVisible, grupoSeleccionado]);

  const cargarDatos = async (): Promise<void> => {
    if (!grupoSeleccionado) return;

    setLoading(true);
    try {
      const res = await api.get("/api/admin/saldos-resumen", {
        params: {
          conteo_grupo_id: grupoSeleccionado.id,
        },
      });
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

  const grupoOptionTemplate = (option: ConteoGrupo) => {
    return (
      <div
        className="flex align-items-center justify-content-between w-full"
        style={{ minWidth: "14rem" }}
      >
        <span
          style={{
            color: option.activo === 0 ? "#94a3b8" : "#f8fafc", // Forzamos color claro si es activo
            fontWeight: option.activo === 1 ? "500" : "normal",
          }}
        >
          {option.descripcion}
          {option.activo === 0 && (
            <small className="ml-2 font-italic" style={{ opacity: 0.7 }}>
              (Inactivo)
            </small>
          )}
        </span>

        {option.activo === 1 && (
          <i
            className="pi pi-circle-fill"
            style={{
              fontSize: "0.5rem",
              color: "#22c55e", // Verde esmeralda directo (text-green-500)
              marginLeft: "10px",
            }}
          ></i>
        )}
      </div>
    );
  };

  const grupoValueTemplate = (option: ConteoGrupo, props: DropdownProps) => {
    if (!option) return <span>{props.placeholder}</span>;

    return (
      <div className="flex align-items-center gap-2">
        <span
          style={{
            color: "#f8fafc", // Forzamos blanco para el valor seleccionado
            fontWeight: option.activo === 1 ? "600" : "400",
          }}
        >
          {option.descripcion}
        </span>
        {option.activo === 1 && (
          <i
            className="pi pi-circle-fill"
            style={{ fontSize: "0.5rem", color: "#22c55e" }}
          />
        )}
      </div>
    );
  };

  const header = (
    <div className="flex flex-column lg:flex-row lg:justify-content-between lg:align-items-center gap-3">
      {/* SECCIÓN IZQUIERDA: Título, Badge y Selector */}
      <div className="flex flex-wrap align-items-center gap-3">
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

        {/* Selector de Grupo con ancho controlado */}
        <Dropdown
          value={grupoSeleccionado}
          options={grupos}
          optionLabel="descripcion"
          placeholder="Seleccionar conteo"
          itemTemplate={grupoOptionTemplate}
          valueTemplate={grupoValueTemplate}
          className="p-inputtext-sm w-full md:w-16rem custom-dropdown-header"
          onChange={(e) => setGrupoSeleccionado(e.value)}
        />
      </div>

      {/* SECCIÓN DERECHA: Acciones (Filtro, Excel) y Buscador */}
      <div className="flex flex-wrap gap-2 align-items-center">
        {/* Contenedor para botones para que no se separen */}
        <div className="flex gap-2">
          <Button
            label={soloConDiferencia ? "Todos" : "Diferencias"}
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
            tooltipOptions={{ position: "top" }}
          />
        </div>

        {/* Buscador con IconField */}
        <IconField iconPosition="left">
          <InputIcon className="pi pi-search" />
          <InputText
            placeholder="Buscar..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="p-inputtext-sm w-full md:w-12rem"
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
          conteo_grupo_id={grupoSeleccionado!.id}
          onConteoAnulado={cargarDatos}
        />
      )}
    </div>
  );
}
