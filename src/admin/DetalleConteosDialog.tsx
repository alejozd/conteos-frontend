import { useEffect, useState, useRef  } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import api from "../services/api";

interface ConteoDetalle {
  id: number;
  usuario: string;
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
  codigo: number;
  subcodigo: number;
  nombre: string;
  onConteoAnulado: () => Promise<void>;
}

export default function DetalleConteosDialog({
  visible,
  onHide,
  codigo,
  subcodigo,
  nombre,
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
    setLoading(true);
    try {
      const res = await api.get("/api/admin/conteos-detalle", {
        params: { codigo, subcodigo },
      });
      setData(res.data || []);
    } catch (error) {
      console.error("Error cargando detalle de conteos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      cargarDetalle();
    }
  }, [visible]);  

  const formatearFecha = (value: string) => {
  return new Date(value).toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  };


  const abrirAnulacion = (id: number) => {
  setConteoId(id);
  setMotivoAnulacion("");
  setAnularVisible(true);
  };

  const ejecutarAnulacion = async () => {
  if (!conteoId || !motivoAnulacion.trim()) {
    toast.current?.show({
      severity: "warn",
      summary: "Motivo requerido",
      detail: "Debe ingresar un motivo de anulación",
      life: 3000,
    });
    return;
  }

  try {
    await api.put(`/api/admin/conteos/${conteoId}/anular`, {
      motivo: motivoAnulacion,
    });

    toast.current?.show({
      severity: "success",
      summary: "Conteo anulado",
      detail: "El conteo fue anulado correctamente",
      life: 3000,
    });

    cargarDetalle();
    onConteoAnulado();
    setAnularVisible(false);
setConteoId(null);
  } catch (error) {
    console.error("Error anulando conteo:", error);
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: "No se pudo anular el conteo",
    });
  }
};




  return (    
    <Dialog
      header={`Detalle de conteos - ${nombre}`}
      visible={visible}
      style={{ width: "70vw" }}
      onHide={onHide}
      modal
    >     
    <Toast ref={toast} />
    
      <DataTable
        value={data}
        loading={loading}
        paginator
        rows={10}
        stripedRows
        emptyMessage="No hay conteos para este producto"
        rowClassName={(row: ConteoDetalle) =>
        row.estado === "ANULADO" ? "row-anulado" : ""}
      >
        <Column field="usuario" header="Usuario" />
        <Column field="bodega" header="Bodega" />
        <Column field="ubicacion" header="Ubicación" />
        <Column
          field="cantidad"
          header="Cantidad"
          body={(row) => Number(row.cantidad).toFixed(2)}
          style={{ textAlign: "right" }}
        />
        <Column
  field="timestamp"
  header="Fecha"
  body={(row) => formatearFecha(row.timestamp)}
/>

        <Column
  field="estado"
  header="Estado"
  body={(row: ConteoDetalle) =>
    row.estado === "ANULADO" ? (
      <span className="estado-anulado">ANULADO</span>
    ) : (
      "VIGENTE"
    )
  }
/>


        <Column
  header="Acción"
  body={(row: ConteoDetalle) =>
    row.estado === "VIGENTE" ? (
      <Button
  icon="pi pi-times"
  className="p-button-text p-button-danger p-button-sm"
  onClick={() => abrirAnulacion(row.id)}
/>
    ) : (
      <Button
        icon="pi pi-info-circle"
        className="p-button-text p-button-secondary p-button-sm"
        onClick={() => {
          setConteoInfo(row);
          setInfoVisible(true);
        }}
      />
    )
  }
/>

      </DataTable>
      <Dialog
  header="Anular conteo"
  visible={anularVisible}
  style={{ width: "30vw" }}
  modal
  onHide={() => setAnularVisible(false)}
>
  <div className="flex flex-column gap-3">
    <span>Ingrese el motivo de anulación:</span>

    <InputTextarea
      rows={4}
      autoResize
      value={motivoAnulacion}
      onChange={(e) => setMotivoAnulacion(e.target.value)}
      placeholder="Motivo obligatorio"
    />

    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        className="p-button-text"
        onClick={() => setAnularVisible(false)}
      />
      <Button
        label="Anular"
        className="p-button-danger"
        onClick={ejecutarAnulacion}
      />
    </div>
  </div>
</Dialog>
<Dialog
  header="Información de anulación"
  visible={infoVisible}
  style={{ width: "25vw" }}
  modal
  onHide={() => setInfoVisible(false)}
>
  {conteoInfo && (
    <div className="flex flex-column gap-2">
      <strong>Usuario que anuló:</strong>
      <span>{conteoInfo.usuario_anula || "N/A"}</span>

      <strong>Fecha:</strong>
      <span>
        {conteoInfo.fecha_anulacion
          ? formatearFecha(conteoInfo.fecha_anulacion)
          : "N/A"}
      </span>

      <strong>Motivo:</strong>
      <span>{conteoInfo.motivo_anulacion || "N/A"}</span>
    </div>
  )}
</Dialog>


    </Dialog>
  );
}
