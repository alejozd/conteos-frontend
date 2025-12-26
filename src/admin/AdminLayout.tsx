import { Menubar } from "primereact/menubar";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const items = [
    {
      label: "Saldos",
      icon: "pi pi-table",
      command: () => navigate("/admin"),
    },
    {
      label: "Conteos anulados",
      icon: "pi pi-ban",
      command: () => navigate("/admin/conteos-anulados"),
    },
    {
      label: "Importar",
      icon: "pi pi-upload",
      command: () => navigate("/admin/importar"),
    },
    {
      label: "Productos",
      icon: "pi pi-box",
      command: () => navigate("/admin/productos"),
    },
    {
      label: "Usuarios",
      icon: "pi pi-users",
      command: () => navigate("/admin/usuarios"),
    },
    {
      label: "Bodegas",
      icon: "pi pi-warehouse",
      command: () => navigate("/admin/bodegas"),
    },
    {
      label: "Ubicaciones",
      icon: "pi pi-map-marker",
      command: () => navigate("/admin/ubicaciones"),
    },
    {
      label: "Grupos de conteo",
      icon: "pi pi-tags",
      command: () => navigate("/admin/conteos-grupos"),
    },
    {
      label: "Salir",
      icon: "pi pi-sign-out",
      command: () => {
        logout();
        navigate("/login");
      },
    },
  ];

  return (
    <>
      <Menubar model={items} />
      <div className="p-4">
        <Outlet />
      </div>
    </>
  );
}
