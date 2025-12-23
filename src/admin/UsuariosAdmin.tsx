import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputSwitch } from "primereact/inputswitch";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { useRef } from "react";
import api from "../services/api";
import { Tag } from "primereact/tag";
import UsuarioDialog from "./UsuarioDialog";

interface UsuarioRow {
  id: number;
  username: string;
  role: "admin" | "user";
  activo: number;
  empresa: string | null;
}

export default function UsuariosAdmin() {
  const [data, setData] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioRow | null>(
    null
  );
  const toast = useRef<Toast>(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/usuarios");
      setData(res.data || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const rolTemplate = (row: UsuarioRow) => (
    <Tag
      value={row.role.toUpperCase()}
      severity={row.role === "admin" ? "warning" : "info"}
    />
  );

  const cambiarEstado = (row: UsuarioRow, nuevoEstado: boolean) => {
    confirmDialog({
      message: `¿Seguro que desea ${
        nuevoEstado ? "activar" : "desactivar"
      } al usuario ${row.username}?`,
      header: "Confirmación",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          setProcesandoId(row.id);
          await api.patch(`/api/admin/usuarios/${row.id}/estado`, {
            activo: nuevoEstado,
          });

          toast.current?.show({
            severity: "success",
            summary: "Actualizado",
            detail: "Estado del usuario actualizado",
            life: 3000,
          });

          cargarUsuarios();
        } catch (error) {
          let msg = "No se pudo cambiar el estado";
          if (error instanceof Error) {
            msg = error.message;
          }
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: msg,
          });
        } finally {
          setProcesandoId(null);
        }
      },
    });
  };

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="flex justify-content-between align-items-center mb-3">
        <h3>Administración de usuarios</h3>
        <Button
          label="Nuevo usuario"
          icon="pi pi-plus"
          className="p-button-sm"
          onClick={() => {
            setUsuarioEditando(null); // crear
            setDialogVisible(true);
          }}
        />
      </div>

      <DataTable
        value={data}
        loading={loading}
        paginator
        rows={15}
        stripedRows
        showGridlines
        emptyMessage="No hay usuarios"
      >
        <Column field="username" header="Usuario" sortable />
        <Column field="empresa" header="Empresa" sortable />
        <Column header="Rol" body={rolTemplate} sortable />
        <Column
          header="Activo"
          body={(row: UsuarioRow) => (
            <InputSwitch
              checked={!!row.activo}
              disabled={row.username === "alejo" || procesandoId === row.id}
              onChange={(e) => cambiarEstado(row, e.value)}
            />
          )}
        />
        <Column
          header="Acciones"
          body={(row: UsuarioRow) => (
            <Button
              icon="pi pi-pencil"
              className="p-button-text p-button-sm"
              disabled={row.username === "alejo"}
              onClick={() => {
                setUsuarioEditando(row); // editar
                setDialogVisible(true);
              }}
            />
          )}
        />
      </DataTable>
      {dialogVisible && (
        <UsuarioDialog
          visible={dialogVisible}
          usuario={usuarioEditando}
          onHide={() => setDialogVisible(false)}
          onSuccess={cargarUsuarios}
        />
      )}
    </div>
  );
}
