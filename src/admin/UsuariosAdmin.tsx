import { useEffect, useState, useRef, useContext, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputSwitch } from "primereact/inputswitch";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown"; // Importante para el filtro
import api from "../services/api";
import UsuarioDialog from "./UsuarioDialog";
import { AuthContext } from "../context/AuthContext"; // Importamos el contexto

interface UsuarioRow {
  id: number;
  username: string;
  role: "user" | "admin" | "superadmin";
  activo: number;
  empresa_id?: number;
  empresa?: string | null;
}

interface EmpresaData {
  id: number;
  nombre: string;
}

export default function UsuariosAdmin() {
  const authContext = useContext(AuthContext);
  const me = authContext?.user;

  const [data, setData] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioRow | null>(
    null,
  );

  // Estados para el filtro de empresas (Superadmin)
  const [empresas, setEmpresas] = useState<
    { label: string; value: number | null }[]
  >([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<number | null>(
    null,
  );

  const toast = useRef<Toast>(null);

  useEffect(() => {
    cargarUsuarios();
    if (me?.role === "superadmin") {
      cargarEmpresas();
    }
  }, [me]);

  const cargarEmpresas = async () => {
    try {
      const res = await api.get("/api/admin/empresas");
      const listado = res.data.map((e: EmpresaData) => ({
        label: e.nombre,
        value: e.id,
      }));
      setEmpresas([{ label: "Todas las empresas", value: null }, ...listado]);
    } catch (error) {
      console.error("Error cargando empresas para filtro:", error);
    }
  };

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/usuarios");
      let usuarios = res.data || [];

      // Lógica de visibilidad:
      // 1. Si NO soy superadmin, oculto a cualquier otro superadmin de la lista.
      if (me?.role !== "superadmin") {
        usuarios = usuarios.filter((u: UsuarioRow) => u.role !== "superadmin");
      }

      setData(usuarios);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado por empresa en el cliente
  const usuariosFiltrados = useMemo(() => {
    if (empresaSeleccionada === null) return data;
    return data.filter((u) => u.empresa_id === empresaSeleccionada);
  }, [data, empresaSeleccionada]);

  const rolTemplate = (row: UsuarioRow) => {
    const severity =
      row.role === "superadmin"
        ? "danger"
        : row.role === "admin"
          ? "warning"
          : "info";
    return (
      <Tag
        value={row.role.toUpperCase()}
        severity={severity}
        className="px-3"
        style={{ borderRadius: "8px" }}
      />
    );
  };

  const cambiarEstado = (row: UsuarioRow, nuevoEstado: boolean) => {
    confirmDialog({
      message: `¿Seguro que desea ${nuevoEstado ? "activar" : "desactivar"} al usuario ${row.username}?`,
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
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudo cambiar el estado, " + error,
          });
        } finally {
          setProcesandoId(null);
        }
      },
    });
  };

  const header = (
    <div className="flex flex-column gap-3">
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
        <div className="flex align-items-center gap-3">
          <i className="pi pi-users text-primary text-3xl" />
          <h2 className="m-0 text-3xl font-bold text-900 tracking-tight">
            Administración de Usuarios
          </h2>
          <Tag
            value={usuariosFiltrados.length}
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

      <div className="flex flex-column md:flex-row align-items-center bg-gray-900 p-3 border-round border-1 border-gray-800 gap-3">
        <div className="flex-1 w-full">
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search text-gray-400" />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar por usuario o empresa..."
              className="p-inputtext-sm w-full bg-gray-800 text-gray-100"
            />
          </IconField>
        </div>

        {/* Filtro de Empresa solo para Superadmin */}
        {me?.role === "superadmin" && (
          <Dropdown
            value={empresaSeleccionada}
            options={empresas}
            onChange={(e) => setEmpresaSeleccionada(e.value)}
            placeholder="Filtrar por Empresa"
            className="w-full md:w-20rem p-inputtext-sm"
            showClear={empresaSeleccionada !== null}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="card shadow-2 border-round">
      <Toast ref={toast} />
      <ConfirmDialog />

      <DataTable
        value={usuariosFiltrados}
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
          body={(row) => row.empresa || "GLOBAL / SIN ASIGNAR"}
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
              disabled={
                row.username === me?.username || procesandoId === row.id
              }
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
              disabled={
                row.username === me?.username && row.role !== "superadmin"
              }
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
          toastRef={toast}
        />
      )}
    </div>
  );
}
