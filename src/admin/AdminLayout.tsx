import { Menubar } from "primereact/menubar";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "primereact/button";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const nombreEmpresa = localStorage.getItem("empresa_seleccionada_nombre");
  const isSuperAdmin = user?.role === "superadmin";

  const menuItems = [
    { label: "Saldos", icon: "pi pi-table", command: () => navigate("/admin") },
    {
      label: "Conteos",
      icon: "pi pi-list",
      items: [
        {
          label: "Grupos de Conteo",
          icon: "pi pi-tags",
          command: () => navigate("/admin/conteos-grupos"),
        },
        {
          label: "Asignación de Tareas",
          icon: "pi pi-users",
          command: () => navigate("/admin/asignacion-tareas"),
        },
        {
          label: "Comparativo de Conteos",
          icon: "pi pi-arrows-h",
          command: () => navigate("/admin/comparativa-conteos"),
        },
        {
          label: "Conteos Anulados",
          icon: "pi pi-ban",
          command: () => navigate("/admin/conteos-anulados"),
        },
      ],
    },
    {
      label: "Configuración",
      icon: "pi pi-cog",
      items: [
        {
          label: "Productos",
          icon: "pi pi-box",
          command: () => navigate("/admin/productos"),
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
          label: "Usuarios",
          icon: "pi pi-users",
          command: () => navigate("/admin/usuarios"),
        },
      ],
    },
    {
      label: "Importar",
      icon: "pi pi-upload",
      command: () => navigate("/admin/importar"),
    },
  ];

  if (isSuperAdmin) {
    menuItems.push({
      label: "Empresas",
      icon: "pi pi-building",
      command: () => navigate("/admin/empresas"),
    });
  }

  const start = (
    <div
      className="flex align-items-center gap-2 px-2 cursor-pointer flex-shrink-0"
      onClick={() => navigate("/admin")}
    >
      <i className="pi pi-box text-blue-500 text-2xl"></i>
      <span className="text-xl font-bold text-white tracking-tight hidden sm:inline">
        STOCK<span className="text-blue-500">APP</span>
      </span>
    </div>
  );

  const end = (
    <div className="flex align-items-center gap-2 md:gap-3 flex-shrink-0">
      {nombreEmpresa && (
        <div className="hidden xl:flex flex-column align-items-end border-right-1 border-gray-700 pr-3">
          <span
            className="text-xs text-gray-500 font-semibold uppercase"
            style={{ fontSize: '0.65rem' }}
          >
            Empresa
          </span>
          <span className="text-sm font-bold text-blue-400 leading-tight max-w-15rem white-space-nowrap overflow-hidden text-overflow-ellipsis">
            {nombreEmpresa}
          </span>
        </div>
      )}

      <div className="flex align-items-center gap-1">
        {isSuperAdmin && (
          <Button
            icon="pi pi-sync"
            text
            tooltip="Cambiar Empresa"
            className="p-button-rounded p-button-secondary text-gray-400 h-2rem w-2rem"
            onClick={() => navigate("/seleccionar-empresa")}
          />
        )}
        <Button
          label="Salir"
          icon="pi pi-sign-out"
          text
          severity="danger"
          className="p-button-sm font-bold"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-column bg-gray-950">
      <Menubar
        model={menuItems}
        start={start}
        end={end}
        className="shadow-8"
      />

      <main className="p-3 md:p-4 flex-1 overflow-auto">
        <div className="mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
