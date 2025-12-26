import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { useEffect, useState } from "react";
import api from "../services/api";

interface ConteoGrupo {
  id?: number;
  descripcion: string;
  fecha: string;
}

interface Props {
  visible: boolean;
  grupo: ConteoGrupo | null;
  onHide: () => void;
  onSuccess: () => void;
}

export default function ConteoGrupoDialog({
  visible,
  grupo,
  onHide,
  onSuccess,
}: Props) {
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (grupo) {
      setDescripcion(grupo.descripcion);
      setFecha(new Date(grupo.fecha));
    } else {
      setDescripcion("");
      setFecha(new Date());
    }
  }, [grupo]);

  const guardar = async () => {
    if (!descripcion.trim() || !fecha) return;
    setLoading(true);
    try {
      const payload = {
        descripcion,
        fecha: fecha.toISOString().slice(0, 10),
      };

      if (grupo?.id) {
        await api.put(`/api/admin/conteos-grupos/${grupo.id}`, payload);
      } else {
        await api.post("/api/admin/conteos-grupos", payload);
      }

      onSuccess();
      onHide();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      header={grupo ? "Editar Grupo de Conteo" : "Crear Nuevo Grupo de Conteo"}
      visible={visible}
      style={{ width: "90vw", maxWidth: "450px" }}
      onHide={onHide}
      draggable={false}
      resizable={false}
      footer={
        <div className="flex justify-content-end gap-2 mt-2">
          <Button label="Cancelar" text severity="danger" onClick={onHide} />
          <Button
            label="Guardar Conteo"
            icon="pi pi-check"
            loading={loading}
            onClick={guardar}
            severity="success"
            disabled={!descripcion.trim()}
          />
        </div>
      }
    >
      <div className="flex flex-column gap-4 mt-2">
        <div className="flex flex-column gap-2">
          <label htmlFor="desc" className="font-semibold text-900">
            Descripción del Conteo
          </label>
          <InputText
            id="desc"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full"
            placeholder="Ej: Inventario Anual Diciembre 2025"
            autoFocus
          />
        </div>

        <div className="flex flex-column gap-2">
          <label htmlFor="fecha" className="font-semibold text-900">
            Fecha Programada
          </label>
          <Calendar
            id="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.value as Date)}
            dateFormat="yy-mm-dd"
            className="w-full"
            showIcon
            placeholder="Seleccione fecha"
          />
        </div>
      </div>
    </Dialog>
  );
}
