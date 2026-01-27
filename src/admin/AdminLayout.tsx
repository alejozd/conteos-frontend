import { Menubar } from "primereact/menubar";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "primereact/button";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const nombreEmpresa = localStorage.getItem("empresa_seleccionada_nombre");

  const items = [
    {
      label: "Saldos",
      icon: "pi pi-table",
      command: () => navigate("/admin"),
    },
    {
      label: "Conteos",
      icon: "pi pi-list",
      items: [
        // Menú desplegable
        {
          label: "Grupos de Conteo",
          icon: "pi pi-tags",
          command: () => navigate("/admin/conteos-grupos"),
        },
        {
          label: "Asignación de Tareas", // Nueva opción
          icon: "pi pi-users",
          command: () => navigate("/admin/asignacion-tareas"),
        },
        {
          label: "Comparativo de Conteos", // Nueva opción
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

  const start = (
    <div className="flex align-items-center gap-2 px-1 md:px-2">
      <i className="pi pi-box text-primary text-xl"></i>
      <span className="text-lg md:text-xl font-bold text-white tracking-tight hidden lg:inline">
        STOCK<span className="text-primary">APP</span>
      </span>
      {nombreEmpresa && (
        <div className="flex align-items-center border-left-1 border-gray-700 pl-2 md:pl-3 ml-1">
          <span className="text-xs md:text-sm font-medium text-blue-400 uppercase tracking-wider line-clamp-1 max-w-10rem md:max-w-none">
            {nombreEmpresa}
          </span>
        </div>
      )}
    </div>
  );

  const end = (
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
  );

  return (
    <div className="min-h-screen flex flex-column bg-gray-950">
      <style>{`
        /* 1. Forzar que el menú se colapse a hamburguesa a los 1100px en lugar de 960px */
        @media screen and (max-width: 1100px) {
            .p-menubar .p-menubar-root-list {
                display: none;
            }
            .p-menubar .p-menubar-button {
                display: flex;
            }
        }

        /* 2. Estetica del botón hamburguesa */
        .p-menubar .p-menubar-button {
            order: -1;
            margin-right: 0.5rem;
            color: white;
        }

        /* 3. Ocultar iconos en pantallas medianas para ahorrar espacio */
        @media screen and (max-width: 1250px) {
            .p-menuitem-icon {
                display: none !important;
            }
        }
        
        .p-menuitem-text {
            font-size: 0.85rem;
            font-weight: 500;
        }
      `}</style>

      <Menubar
        model={items}
        start={start}
        end={end}
        className="px-2 md:px-3 border-none border-bottom-1 border-gray-800 bg-gray-900 shadow-8"
        style={{ borderRadius: 0 }}
      />

      <main className="p-3 md:p-4 flex-1">
        <div className="mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
