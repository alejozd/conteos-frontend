import { useEffect, useState, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import api from "../services/api";
import "../styles/Details.css";

interface ConteoDetalle {
  id: number;
  usuario: string;
  bodega?: string;
  ubicacion: string;
  cantidad: number;
  timestamp: string;
  estado: "VIGENTE" | "ANULADO";
  motivo_anulacion?: string;
  usuario_anula?: string;
  fecha_anulacion?: string;
}

interface Props {
  visible: boolean;
  onHide: () => void;
  id: number;
  nombre: string;
  conteo_grupo_id: number;
  onConteoAnulado: () => Promise<void>;
}

export default function DetalleConteosDialog({
  visible,
  onHide,
  id,
  nombre,
  conteo_grupo_id,
  onConteoAnulado,
}: Props) {
  const toast = useRef<Toast>(null);
  const [data, setData] = useState<ConteoDetalle[]>([]);
  const [loading, setLoading] = useState(false);
  const [conteoId, setConteoId] = useState<number | null>(null);
  const [anularVisible, setAnularVisible] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [infoVisible, setInfoVisible] = useState(false);
  const [conteoInfo, setConteoInfo] = useState<ConteoDetalle | null>(null);

  const cargarDetalle = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get("/api/admin/conteos-detalle", {
        params: { producto_id: id, conteo_grupo_id },
      });
      setData(res.data || []);
    } catch (error) {
      console.error("Error cargando detalle:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) cargarDetalle();
  }, [visible]);

  const formatearFecha = (value: string) => {
    return new Date(value).toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const ejecutarAnulacion = async () => {
    if (!conteoId || !motivoAnulacion.trim()) return;
    try {
      await api.put(
        `/api/admin/conteos/${conteoId}/anular?conteo_grupo_id=${conteo_grupo_id}`,
        {
          motivo: motivoAnulacion,
        },
      );
      toast.current?.show({
        severity: "success",
        summary: "Anulado",
        detail: "Registro actualizado",
      });
      cargarDetalle();
      onConteoAnulado();
      setAnularVisible(false);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo anular. " + error,
      });
    }
  };

  const statusTemplate = (row: ConteoDetalle) => {
    const isAnulado = row.estado === "ANULADO";
    return (
      <span
        className={`badge-status ${isAnulado ? "badge-anulado" : "badge-vigente"}`}
      >
        {row.estado}
      </span>
    );
  };

  return (
    <Dialog
      header={
        <div className="flex align-items-center gap-3">
          <i className="pi pi-list text-blue-400 text-xl"></i>
          <div className="flex flex-column">
            <span className="text-xl font-bold">Detalle de Conteos</span>
            <small className="text-gray-400 font-normal">
              Producto: {nombre}
            </small>
          </div>
        </div>
      }
      visible={visible}
      style={{ width: "85vw", maxWidth: "1000px" }}
      onHide={onHide}
      modal
      className="details-dialog"
    >
      <Toast ref={toast} />

      <DataTable
        value={data}
        loading={loading}
        paginator
        rows={8}
        className="details-table shadow-2 border-round-lg overflow-hidden"
        emptyMessage="No hay registros de conteo."
        rowClassName={(row: ConteoDetalle) =>
          row.estado === "ANULADO" ? "row-anulado" : ""
        }
      >
        <Column
          field="usuario"
          header="Operario"
          body={(row) => (
            <div className="flex align-items-center gap-2">
              <i className="pi pi-user text-xs opacity-50"></i>
              <span className="font-semibold">{row.usuario}</span>
            </div>
          )}
        />
        <Column field="bodega" header="Bodega" />
        <Column
          field="ubicacion"
          header="Ubicación"
          body={(row) => (
            <Tag
              severity="info"
              value={row.ubicacion}
              style={{
                background: "transparent",
                border: "1px solid #334155",
                color: "#94a3b8",
              }}
            />
          )}
        />
        <Column
          field="cantidad"
          header="Cantidad"
          body={(row) => (
            <span className="font-mono text-lg font-bold text-blue-400">
              {Number(row.cantidad).toFixed(2)}
            </span>
          )}
        />
        <Column
          header="Fecha/Hora"
          body={(row) => (
            <span className="text-sm opacity-80">
              {formatearFecha(row.timestamp)}
            </span>
          )}
        />
        <Column header="Estado" body={statusTemplate} />
        <Column
          header="Acción"
          body={(row: ConteoDetalle) => (
            <div className="flex gap-2">
              {row.estado === "VIGENTE" ? (
                <Button
                  icon="pi pi-times-circle"
                  tooltip="Anular"
                  rounded
                  outlined
                  text
                  severity="danger"
                  size="large"
                  onClick={() => {
                    setConteoId(row.id);
                    setMotivoAnulacion("");
                    setAnularVisible(true);
                  }}
                />
              ) : (
                <Button
                  icon="pi pi-eye"
                  tooltip="Ver detalle de anulación"
                  rounded
                  outlined
                  text
                  severity="info"
                  size="large"
                  // className="p-button-rounded p-button-secondary p-button-text"
                  onClick={() => {
                    setConteoInfo(row);
                    setInfoVisible(true);
                  }}
                />
              )}
            </div>
          )}
        />
      </DataTable>

      {/* DIÁLOGO ANULACIÓN */}
      <Dialog
        header="Confirmar Anulación"
        visible={anularVisible}
        style={{ width: "90vw", maxWidth: "400px" }}
        modal
        className="inner-dialog"
        onHide={() => setAnularVisible(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text text-gray-400"
              onClick={() => setAnularVisible(false)}
            />
            <Button
              label="Confirmar Anulación"
              icon="pi pi-check"
              className="p-button-danger"
              onClick={ejecutarAnulacion}
            />
          </div>
        }
      >
        <div className="flex flex-column gap-3 py-2">
          <label className="font-bold text-sm">Motivo de la anulación:</label>
          <InputTextarea
            rows={3}
            value={motivoAnulacion}
            onChange={(e) => setMotivoAnulacion(e.target.value)}
            placeholder="Ej: Error de digitación, ubicación incorrecta..."
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>
      </Dialog>

      {/* DIÁLOGO INFO ANULACIÓN */}
      <Dialog
        header="Información de Anulación"
        visible={infoVisible}
        style={{ width: "90vw", maxWidth: "450px" }}
        modal
        className="inner-dialog"
        onHide={() => setInfoVisible(false)}
      >
        {conteoInfo && (
          <div
            className="surface-ground p-3 border-round-lg flex flex-column gap-3"
            style={{ background: "#0f172a" }}
          >
            <div className="flex justify-content-between border-bottom-1 border-gray-800 pb-2">
              <span className="text-gray-400">Anulado por:</span>
              <span className="font-bold text-red-400">
                {conteoInfo.usuario_anula}
              </span>
            </div>
            <div className="flex justify-content-between border-bottom-1 border-gray-800 pb-2">
              <span className="text-gray-400">Fecha:</span>
              <span>
                {conteoInfo.fecha_anulacion
                  ? formatearFecha(conteoInfo.fecha_anulacion)
                  : "N/A"}
              </span>
            </div>
            <div className="flex flex-column gap-2">
              <span className="text-gray-400">Motivo:</span>
              <div className="p-3 bg-gray-800 border-round italic text-sm">
                "{conteoInfo.motivo_anulacion || "Sin motivo registrado"}"
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </Dialog>
  );
}
