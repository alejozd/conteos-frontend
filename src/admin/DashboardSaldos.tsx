// src/admin/DashboardSaldos.tsx
import { useEffect, useState, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Dropdown, type DropdownProps } from "primereact/dropdown";
import DetalleConteosDialog from "./DetalleConteosDialog";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import "../styles/Dashboard.css";

interface SaldoRow {
  id: number;
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
  const [soloConConteo, setSoloConConteo] = useState(false);
  const [totalAnulados, setTotalAnulados] = useState(0);
  const [grupos, setGrupos] = useState<ConteoGrupo[]>([]);
  const [grupoSeleccionado, setGrupoSeleccionado] =
    useState<ConteoGrupo | null>(null);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarGrupos = async () => {
      try {
        const res = await api.get("/api/admin/conteos-grupos");
        const data = res.data || [];
        setGrupos(data);

        if (data.length > 0) {
          const grupoActivo = data.find((g: ConteoGrupo) => g.activo === 1);
          setGrupoSeleccionado(grupoActivo || data[0]);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error cargando grupos:", error);
      }
    };

    cargarGrupos();
  }, []);

  useEffect(() => {
    if (grupos.length === 0 || !grupoSeleccionado) return;

    cargarDatos();

    const interval = setInterval(() => {
      if (!detalleVisible) {
        cargarDatos();
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [detalleVisible, grupoSeleccionado, grupos.length]);

  const cargarDatos = async (): Promise<void> => {
    if (!grupoSeleccionado) return;

    setLoading(true);
    try {
      const [resSaldos, resAnulados, resConteoStats] = await Promise.all([
        api.get("/api/admin/saldos-resumen", {
          params: { conteo_grupo_id: grupoSeleccionado.id },
        }),
        api.get("/api/admin/conteos-anulados", {
          params: { conteo_grupo_id: grupoSeleccionado.id },
        }),
        api.get("/api/admin/conteos-stats", {
          params: { conteo_grupo_id: grupoSeleccionado.id },
        }),
      ]);

      setData(resSaldos.data || []);
      setTotalAnulados(resAnulados.data.length || 0);
      setTotalRegistros(resConteoStats.data.total_registros || 0);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const productosContados = data.filter(
    (r) => Number(r.conteo_total) > 0,
  ).length;
  const porcentajeAvance =
    data.length > 0 ? Math.round((productosContados / data.length) * 100) : 0;

  const aplicarFiltroSincrono = (accion: () => void) => {
    setLoading(true);
    setTimeout(() => {
      accion();
      setLoading(false);
    }, 100);
  };

  const toggleDiferencias = () => {
    aplicarFiltroSincrono(() => setSoloConDiferencia(!soloConDiferencia));
  };

  const toggleSoloConteos = () => {
    aplicarFiltroSincrono(() => setSoloConConteo(!soloConConteo));
  };

  const dataFiltrada = useMemo(() => {
    return data.filter((r) => {
      const cumpleDiferencia = soloConDiferencia
        ? Number(r.diferencia) !== 0
        : true;
      const cumpleConteo = soloConConteo ? Number(r.conteo_total) > 0 : true;
      return cumpleDiferencia && cumpleConteo;
    });
  }, [data, soloConDiferencia, soloConConteo]);

  const totalDiferencias = data.filter(
    (r) => Number(r.diferencia) !== 0,
  ).length;

  const diferenciaTemplate = (row: SaldoRow) => {
    const valor = Number(row.diferencia);
    let className = "diff-neutral";
    if (valor > 0) className = "diff-positive";
    if (valor < 0) className = "diff-negative";
    return <span className={className}>{valor.toFixed(2)}</span>;
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
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `saldos_conteos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const grupoOptionTemplate = (option: ConteoGrupo) => {
    return (
      <div className="flex align-items-center justify-content-between w-full" style={{ minWidth: "14rem" }}>
        <span style={{ color: option.activo === 0 ? "#94a3b8" : "#f8fafc", fontWeight: option.activo === 1 ? "500" : "normal" }}>
          {option.descripcion}
          {option.activo === 0 && <small className="ml-2 font-italic" style={{ opacity: 0.7 }}>(Inactivo)</small>}
        </span>
        {option.activo === 1 && <i className="pi pi-circle-fill" style={{ fontSize: "0.5rem", color: "#22c55e", marginLeft: "10px" }}></i>}
      </div>
    );
  };

  const grupoValueTemplate = (option: ConteoGrupo, props: DropdownProps) => {
    if (!option) return <span>{props.placeholder}</span>;
    return (
      <div className="flex align-items-center gap-2">
        <span style={{ color: "#f8fafc", fontWeight: option.activo === 1 ? "600" : "400" }}>{option.descripcion}</span>
        {option.activo === 1 && <i className="pi pi-circle-fill" style={{ fontSize: "0.5rem", color: "#22c55e" }} />}
      </div>
    );
  };

  const header = (
    <div className="flex flex-column gap-2 mb-2">
      <PageHeader
        title="Saldos vs Conteos"
        icon="pi pi-chart-line"
        actions={
          <Dropdown
            value={grupoSeleccionado}
            options={grupos}
            optionLabel="descripcion"
            placeholder="Seleccionar conteo"
            itemTemplate={grupoOptionTemplate}
            valueTemplate={grupoValueTemplate}
            className="p-inputtext-sm w-full md:w-20rem"
            onChange={(e) => setGrupoSeleccionado(e.value)}
          />
        }
      />

      <div className="grid mt-1 mb-2 px-1">
        <div className="col-12 sm:col-6 md:col-3 p-1">
          <StatCard
            label="Avance General"
            value={`${porcentajeAvance}%`}
            subtext={`${productosContados} / ${data.length}`}
            icon="pi pi-chart-bar"
            colorClass="color-blue"
            borderColorClass="stat-card-blue"
            sideSubtext
            compact
          >
            <div className="w-full bg-gray-800 border-round overflow-hidden mt-1" style={{ height: "6px" }}>
               <div className="bg-blue transition-all transition-duration-500" style={{ width: `${porcentajeAvance}%`, height: "100%" }} />
            </div>
          </StatCard>
        </div>

        <div className="col-12 sm:col-6 md:col-3 p-1">
          <StatCard
            label="Con Diferencia"
            value={totalDiferencias}
            subtext="Pendientes de revisión"
            icon="pi pi-exclamation-triangle"
            colorClass="color-red"
            borderColorClass="stat-card-red"
            onClick={toggleDiferencias}
            compact
          />
        </div>

        <div className="col-12 sm:col-6 md:col-3 p-1">
          <StatCard
            label="Registros"
            value={totalRegistros}
            subtext="Operaciones guardadas"
            icon="pi pi-clone"
            colorClass="color-green"
            borderColorClass="stat-card-green"
            onClick={toggleSoloConteos}
            compact
          />
        </div>

        <div className="col-12 sm:col-6 md:col-3 p-1">
          <StatCard
            label="Anulados"
            value={totalAnulados}
            subtext="Correcciones realizadas"
            icon="pi pi-trash"
            colorClass="color-orange"
            borderColorClass="stat-card-orange"
            onClick={() => navigate("/admin/conteos-anulados", { state: { grupoId: grupoSeleccionado?.id } })}
            compact
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-content-between align-items-center gap-2 px-1">
        <div className="flex flex-wrap gap-2">
          <Button
            label="Diferencias"
            icon="pi pi-filter"
            className={`p-button-sm ${soloConDiferencia ? "" : "p-button-outlined"}`}
            style={{
              borderColor: '#3b82f6',
              backgroundColor: soloConDiferencia ? '#3b82f6' : 'transparent',
              color: soloConDiferencia ? 'white' : '#3b82f6'
            }}
            onClick={toggleDiferencias}
            disabled={loading}
          />
          <Button
            label="Con Conteos"
            icon="pi pi-box"
            className={`p-button-sm ${soloConConteo ? "" : "p-button-outlined"}`}
            style={{
              borderColor: '#3b82f6',
              backgroundColor: soloConConteo ? '#3b82f6' : 'transparent',
              color: soloConConteo ? 'white' : '#3b82f6'
            }}
            onClick={toggleSoloConteos}
            disabled={loading}
          />
          <Button
            label="Excel"
            icon="pi pi-file-excel"
            className="p-button-sm p-button-success p-button-outlined"
            onClick={exportarExcel}
          />
        </div>

        <IconField iconPosition="left" className="ml-auto">
          <InputIcon className="pi pi-search" />
          <InputText
            placeholder="Buscar producto..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="p-inputtext-sm w-full md:w-20rem bg-gray-900 border-gray-700"
          />
        </IconField>
      </div>
    </div>
  );

  return (
    <div className="card">
      {grupos.length === 0 && !loading && (
        <div className="p-3 mb-2 border-round bg-orange-100 text-orange-700 border-1 border-orange-200">
          <i className="pi pi-exclamation-circle mr-2"></i>
          No has creado ningún <strong>Grupo de Conteo</strong> todavía.
        </div>
      )}
      <DataTable
        value={dataFiltrada}
        loading={loading}
        paginator
        rows={15}
        globalFilter={globalFilter}
        globalFilterFields={["nombre", "referencia"]}
        header={header}
        emptyMessage="No hay datos para mostrar"
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column field="nombre" header="Producto" sortable />
        <Column field="referencia" header="Referencia" sortable />
        <Column field="saldo_sistema" header="Saldo sistema" sortable body={(row) => Number(row.saldo_sistema).toFixed(2)} style={{ textAlign: "right" }} />
        <Column field="conteo_total" header="Conteo" sortable body={(row) => Number(row.conteo_total).toFixed(2)} style={{ textAlign: "right" }} />
        <Column header="Diferencia" body={diferenciaTemplate} sortable style={{ textAlign: "right" }} />
        <Column header="Detalle" body={(row: SaldoRow) => {
            const tieneDetalle = Number(row.conteo_total) > 0;
            return (
              <Button
                icon="pi pi-eye"
                className="p-button-text p-button-sm"
                disabled={!tieneDetalle}
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
          id={productoSeleccionado.id}
          nombre={productoSeleccionado.nombre}
          conteo_grupo_id={grupoSeleccionado!.id}
          onConteoAnulado={cargarDatos}
        />
      )}
    </div>
  );
}
