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
      className="flex align-items-center gap-2 px-2 cursor-pointer"
      onClick={() => navigate("/admin")}
    >
      <i className="pi pi-box text-primary text-2xl"></i>
      <span className="text-xl font-bold text-white tracking-tight hidden sm:inline">
        STOCK<span className="text-primary">APP</span>
      </span>
    </div>
  );

  const end = (
    <div className="flex align-items-center gap-2 md:gap-4">
      {nombreEmpresa && (
        <div className="hidden lg:flex flex-column align-items-end border-right-1 border-gray-700 pr-3">
          <span className="text-xs text-gray-500 font-semibold uppercase">
            Empresa
          </span>
          <span className="text-sm font-bold text-blue-400 leading-tight">
            {nombreEmpresa}
          </span>
        </div>
      )}

      <div className="flex align-items-center gap-2">
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
      <style>{`
        /* 1. Mover botón hamburguesa al inicio */
        .p-menubar .p-menubar-button {
            order: -1; /* Esto lo manda al puro principio del flexbox */
            margin-right: 0.5rem;
            color: white !important;
        }
            @media screen and (max-width: 960px) {
      .p-menubar-start {
          margin-right: auto; 
      }
  }

        /* 2. Estilo de los iconos del menú */
        .p-menuitem-icon {
            color: #3B82F6 !important; 
            margin-right: 0.5rem !important;
        }

        /* 3. Estética general del Menubar */
        .p-menubar {
            padding: 0.5rem 1rem !important;
            background: #111827 !important;
            border-color: #1f2937 !important;
            border-radius: 0;
        }

        .p-menuitem-text {
            font-size: 0.85rem;
            color: #e5e7eb;
        }

        /* 4. Asegurar que el menú desplegable en móvil se vea bien sobre el fondo oscuro */
        @media screen and (max-width: 960px) {
            .p-menubar-root-list {
                background: #111827 !important;
                border: 1px solid #1f2937 !important;
                padding: 1rem !important;
            }
        }
      `}</style>

      <Menubar
        model={menuItems}
        start={start}
        end={end}
        className="border-none border-bottom-1 shadow-8"
      />

      <main className="p-3 md:p-4 flex-1 overflow-auto">
        <div className="mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
