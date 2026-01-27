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
import "../styles/DashboardSaldos.css";
import { useNavigate } from "react-router-dom";

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

        // LÓGICA DE SELECCIÓN INTELIGENTE
        if (data.length > 0) {
          // Buscamos el que tenga activo === 1
          const grupoActivo = data.find((g: ConteoGrupo) => g.activo === 1);

          // Si hay uno activo lo seleccionamos, si no, tomamos el primero por defecto
          setGrupoSeleccionado(grupoActivo || data[0]);
        } else {
          // IMPORTANTE: Si no hay grupos, apagamos el loading aquí
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
        }), // Tu nuevo endpoint
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

    // Usamos un pequeño setTimeout para permitir que React renderice el estado 'loading: true'
    // antes de ejecutar la pesada tarea de filtrado
    setTimeout(() => {
      accion();
      setLoading(false);
    }, 100);
  };

  // Handlers para los botones
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

  // Cálculos para indicadores
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

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(
      blob,
      `saldos_conteos_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

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
    <div className="flex flex-column gap-3">
      {/* FILA 1: Título y Selector de Grupo */}
      <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3">
        <h3 className="m-0 dashboard-title">Saldos vs Conteos</h3>
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
      </div>

      {/* FILA 2: Indicadores Rápidos (KPIs) Compactos */}
      <div className="grid mt-1">
        {/* AVANCE */}
        <div className="col-12 sm:col-6 md:col-3">
          <div className="kpi-card shadow-1 border-avance">
            <div className="flex align-items-center gap-2 mb-1">
              <i className="pi pi-chart-bar color-avance text-xs"></i>
              <span className="kpi-label color-avance">Avance General</span>
            </div>
            <div className="flex justify-content-between align-items-end">
              <span className="kpi-value color-avance">
                {porcentajeAvance}%
              </span>
              <span className="kpi-subtext mb-1">
                {productosContados} / {data.length}
              </span>
            </div>
            <div
              className="w-full bg-gray-800 border-round mt-2"
              style={{ height: "4px" }}
            >
              <div
                className="bg-blue-500 border-round"
                style={{ width: `${porcentajeAvance}%`, height: "100%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* DIFERENCIAS */}
        <div className="col-12 sm:col-6 md:col-3">
          <div
            className="kpi-card shadow-1 border-diferencias cursor-pointer"
            onClick={toggleDiferencias}
          >
            <div className="flex align-items-center gap-2 mb-1">
              <i className="pi pi-exclamation-triangle color-diferencias text-xs"></i>
              <span className="kpi-label color-diferencias">
                Con Diferencia
              </span>
            </div>
            <div className="flex flex-column">
              <span className="kpi-value color-diferencias">
                {totalDiferencias}
              </span>
              <span className="kpi-subtext">Pendientes de revisión</span>
            </div>
          </div>
        </div>

        {/* REGISTROS */}
        <div className="col-12 sm:col-6 md:col-3">
          <div
            className="kpi-card shadow-1 border-registros cursor-pointer"
            onClick={toggleSoloConteos}
          >
            <div className="flex align-items-center gap-2 mb-1">
              <i className="pi pi-clone color-registros text-xs"></i>
              <span className="kpi-label color-registros">Registros</span>
            </div>
            <div className="flex flex-column">
              <span className="kpi-value color-registros">
                {totalRegistros}
              </span>
              <span className="kpi-subtext">Operaciones guardadas</span>
            </div>
          </div>
        </div>

        {/* ANULADOS */}
        <div className="col-12 sm:col-6 md:col-3">
          <div
            className="kpi-card shadow-1 border-anulados cursor-pointer"
            onClick={() =>
              navigate("/admin/conteos-anulados", {
                state: { grupoId: grupoSeleccionado?.id },
              })
            }
          >
            <div className="flex align-items-center gap-2 mb-1">
              <i className="pi pi-trash color-anulados text-xs"></i>
              <span className="kpi-label color-anulados">Anulados</span>
            </div>
            <div className="flex flex-column">
              <span className="kpi-value color-anulados">{totalAnulados}</span>
              <span className="kpi-subtext">Correcciones realizadas</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILA 3: Botones de Acción y Buscador */}
      <div className="flex flex-wrap lg:justify-content-between align-items-center gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            label="Diferencias"
            icon="pi pi-filter"
            className={`p-button-sm ${
              soloConDiferencia ? "p-button-danger" : "p-button-outlined"
            }`}
            onClick={toggleDiferencias} // Nueva función con loading
            disabled={loading} // Evita clics dobles mientras procesa
          />
          <Button
            label="Con Conteos"
            icon="pi pi-box"
            className={`p-button-sm ${
              soloConConteo ? "p-button-success" : "p-button-outlined"
            }`}
            onClick={toggleSoloConteos} // Nueva función con loading
            disabled={loading}
          />
          <Button
            label="Excel"
            icon="pi pi-file-excel"
            className="p-button-sm p-button-success p-button-outlined"
            onClick={exportarExcel}
          />
        </div>

        <IconField iconPosition="left">
          <InputIcon className="pi pi-search" />
          <InputText
            placeholder="Buscar producto..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="p-inputtext-sm w-full md:w-15rem"
          />
        </IconField>
      </div>
    </div>
  );

  return (
    <div className="card">
      {grupos.length === 0 && !loading && (
        <div className="p-3 mb-3 border-round bg-orange-100 text-orange-700 border-1 border-orange-200">
          <i className="pi pi-exclamation-circle mr-2"></i>
          No has creado ningún <strong>Grupo de Conteo</strong> todavía. Ve a la
          sección de configuración para crear uno y empezar a ver saldos.
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
          id={productoSeleccionado.id}
          nombre={productoSeleccionado.nombre}
          conteo_grupo_id={grupoSeleccionado!.id}
          onConteoAnulado={cargarDatos}
        />
      )}
    </div>
  );
}
