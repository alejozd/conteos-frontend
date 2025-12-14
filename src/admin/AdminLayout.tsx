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
      label: "Importar",
      icon: "pi pi-upload",
      command: () => navigate("/admin/importar"),
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
