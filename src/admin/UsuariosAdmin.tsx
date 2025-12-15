import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import api from "../services/api";
import { Tag } from "primereact/tag";

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

  const activoTemplate = (row: UsuarioRow) => (
    <Tag
      value={row.activo ? "Activo" : "Inactivo"}
      severity={row.activo ? "success" : "danger"}
    />
  );

  const rolTemplate = (row: UsuarioRow) => (
    <Tag
      value={row.role.toUpperCase()}
      severity={row.role === "admin" ? "warning" : "info"}
    />
  );

  return (
    <div className="card">
      <h3>Administración de usuarios</h3>

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
        <Column header="Estado" body={activoTemplate} />
      </DataTable>
    </div>
  );
}
