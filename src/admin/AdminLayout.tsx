import { Menubar } from "primereact/menubar";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "primereact/button";

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

  // Parte izquierda: Logo
  const start = (
    <div className="flex align-items-center gap-2 px-2">
      <i className="pi pi-box text-primary text-xl"></i>
      <span className="text-xl font-bold text-white tracking-tight hidden sm:inline">
        STOCK<span className="text-primary">APP</span>
      </span>
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
        /* FORZAR ORDEN: Botón hamburguesa primero, luego el logo */
        .p-menubar .p-menubar-button {
            order: -1;
            margin-right: 1rem;
            color: white;
        }
        
        /* Evitar que el menú se rompa tan rápido */
        @media screen and (max-width: 960px) {
            .p-menubar-root-list {
                background: #111827 !important; /* bg-gray-900 */
                border: 1px solid #1f2937 !important;
                padding: 1rem !important;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
            }
        }

        /* Ajuste de los textos del menú para que no se amontonen */
        .p-menuitem-text {
            font-size: 0.9rem;
        }
      `}</style>

      <Menubar
        model={items}
        start={start}
        end={end}
        className="px-3 border-none border-bottom-1 border-gray-800 bg-gray-900 shadow-8"
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
