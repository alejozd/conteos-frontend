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
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
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
  const [globalFilter, setGlobalFilter] = useState("");
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
      className="px-3"
      style={{ borderRadius: "8px" }}
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

  const header = (
    <div className="flex flex-column gap-3">
      {/* FILA SUPERIOR: Título y Botón */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
        <div className="flex align-items-center gap-3">
          <i className="pi pi-users text-primary text-3xl" />
          <h2 className="m-0 text-3xl font-bold text-900 tracking-tight">
            Administración de Usuarios
          </h2>
          <Tag
            value={data.length}
            severity="success"
            className="text-lg px-3 py-1 shadow-1"
            style={{
              borderRadius: "20px",
              background: "linear-gradient(45deg, #22c55e, #16a34a)",
            }}
            icon="pi pi-user-check"
          />
        </div>

        <Button
          label="Nuevo Usuario"
          icon="pi pi-user-plus"
          severity="success"
          className="p-button-sm shadow-2"
          onClick={() => {
            setUsuarioEditando(null);
            setDialogVisible(true);
          }}
        />
      </div>

      {/* FILA INFERIOR: Buscador */}
      <div className="flex align-items-center bg-gray-900 p-3 border-round border-1 border-gray-800">
        <div className="flex-1">
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search text-gray-400" />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar por usuario o empresa..."
              className="p-inputtext-sm w-full md:w-25rem bg-gray-800 text-gray-100"
            />
          </IconField>
        </div>
        <div className="hidden md:flex align-items-center gap-2 bg-gray-800 px-3 py-2 border-round-xl border-1 border-gray-700">
          <span className="text-sm text-gray-400 font-medium">
            Cuentas creadas:
          </span>
          <span className="text-lg font-bold text-green-400">
            {data.length}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="card shadow-2 border-round">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={data}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        stripedRows
        showGridlines
        header={header}
        globalFilter={globalFilter}
        globalFilterFields={["username", "empresa", "role"]}
        emptyMessage="No hay usuarios registrados"
        className="mt-2"
      >
        <Column
          field="username"
          header="Usuario"
          sortable
          style={{ minWidth: "12rem" }}
          className="font-semibold"
        />
        <Column
          field="empresa"
          header="Empresa"
          sortable
          style={{ minWidth: "15rem" }}
        />
        <Column
          header="Rol"
          body={rolTemplate}
          sortable
          style={{ width: "8rem" }}
        />
        <Column
          header="Activo"
          style={{ width: "6rem", textAlign: "center" }}
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
          style={{ width: "6rem", textAlign: "center" }}
          body={(row: UsuarioRow) => (
            <Button
              icon="pi pi-pencil"
              rounded
              text
              severity="info"
              disabled={row.username === "alejo"}
              onClick={() => {
                setUsuarioEditando(row);
                setDialogVisible(true);
              }}
              tooltip="Editar datos"
              tooltipOptions={{ position: "bottom" }}
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
