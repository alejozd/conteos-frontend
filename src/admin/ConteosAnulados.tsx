import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dropdown, type DropdownProps } from "primereact/dropdown";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import api from "../services/api";

interface ConteoAnulado {
  id: number;
  producto: string;
  codigo: number;
  subcodigo: number;
  cantidad: string;
  bodega: string;
  ubicacion: string;
  usuario_conteo: string;
  usuario_anulacion: string;
  motivo_anulacion: string;
  fecha_conteo: string;
  fecha_anulacion: string;
}

interface ConteoGrupo {
  id: number;
  descripcion: string;
  activo: number; // 1 para activo, 0 para inactivo
}

export default function ConteosAnulados() {
  const [data, setData] = useState<ConteoAnulado[]>([]);
  const [loading, setLoading] = useState(false);
  const [grupos, setGrupos] = useState<ConteoGrupo[]>([]);
  const [grupoSeleccionado, setGrupoSeleccionado] =
    useState<ConteoGrupo | null>(null);

  useEffect(() => {
    const cargarGrupos = async () => {
      try {
        const res = await api.get("/api/admin/conteos-grupos");
        const lista = res.data || [];
        setGrupos(lista);
        if (lista.length > 0) setGrupoSeleccionado(lista[0]);
      } catch (error) {
        console.error("Error cargando grupos:", error);
      }
    };
    cargarGrupos();
  }, []);

  useEffect(() => {
    if (grupoSeleccionado) {
      cargarDatos();
    }
  }, [grupoSeleccionado]);

  const cargarDatos = async () => {
    if (!grupoSeleccionado) return;
    setLoading(true);
    try {
      const res = await api.get(
        `/api/admin/conteos-anulados?conteo_grupo_id=${grupoSeleccionado.id}`
      );
      setData(res.data || []);
    } catch (error) {
      console.error("Error cargando conteos anulados:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // --- PLANTILLAS PARA EL DROPDOWN ---
  const grupoOptionTemplate = (option: ConteoGrupo) => {
    return (
      <div
        className="flex align-items-center justify-content-between w-full"
        style={{ minWidth: "15rem" }}
      >
        <span style={{ color: option.activo === 0 ? "#94a3b8" : "#f8fafc" }}>
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
            style={{ fontSize: "0.5rem", color: "#22c55e", marginLeft: "12px" }}
          ></i>
        )}
      </div>
    );
  };

  const grupoValueTemplate = (option: ConteoGrupo, props: DropdownProps) => {
    if (option) return grupoOptionTemplate(option);
    return <span>{props.placeholder}</span>;
  };

  const formatearFecha = (value: string) =>
    new Date(value).toLocaleString("es-CO");

  const exportarExcel = () => {
    const datos = data.map((row) => ({
      Producto: row.producto,
      Código: row.codigo,
      Subcódigo: row.subcodigo,
      Cantidad: Number(row.cantidad),
      Bodega: row.bodega,
      Ubicación: row.ubicacion,
      "Usuario conteo": row.usuario_conteo,
      "Usuario anulación": row.usuario_anulacion,
      "Motivo anulación": row.motivo_anulacion,
      "Fecha conteo": formatearFecha(row.fecha_conteo),
      "Fecha anulación": formatearFecha(row.fecha_anulacion),
    }));

    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Conteos anulados");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(
      blob,
      `anulados_${grupoSeleccionado?.descripcion}_${Date.now()}.xlsx`
    );
  };

  return (
    <div className="card">
      <div className="flex flex-column lg:flex-row justify-content-between align-items-center mb-4 gap-3">
        <div className="flex flex-wrap align-items-center gap-3">
          <h3 className="m-0">Conteos Anulados</h3>
          <Dropdown
            value={grupoSeleccionado}
            options={grupos}
            optionLabel="descripcion"
            placeholder="Seleccionar grupo"
            itemTemplate={grupoOptionTemplate}
            valueTemplate={grupoValueTemplate}
            className="w-full md:w-18rem p-inputtext-sm"
            onChange={(e) => setGrupoSeleccionado(e.value)}
          />
        </div>

        <Button
          label="Exportar a Excel"
          icon="pi pi-file-excel"
          className="p-button-success p-button-sm p-button-outlined"
          onClick={exportarExcel}
          disabled={!data.length}
        />
      </div>

      <DataTable
        value={data}
        loading={loading}
        paginator
        rows={15}
        stripedRows
        showGridlines
        emptyMessage={
          grupoSeleccionado
            ? "No hay anulaciones en este grupo"
            : "Seleccione un grupo"
        }
      >
        <Column field="producto" header="Producto" sortable />
        <Column field="bodega" header="Bodega" sortable />
        <Column field="ubicacion" header="Ubicación" sortable />
        <Column
          field="cantidad"
          header="Cantidad"
          body={(row) => Number(row.cantidad).toFixed(2)}
          style={{ textAlign: "right" }}
          sortable
        />
        <Column field="usuario_conteo" header="Usuario conteo" sortable />
        <Column field="usuario_anulacion" header="Anulado por" sortable />
        <Column field="motivo_anulacion" header="Motivo" />
        <Column
          field="fecha_anulacion"
          header="Fecha anulación"
          body={(row) => formatearFecha(row.fecha_anulacion)}
          sortable
        />
      </DataTable>
    </div>
  );
}
