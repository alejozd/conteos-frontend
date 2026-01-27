// src/components/PostLogin.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ProgressSpinner } from "primereact/progressspinner";
import axios from "axios";
import api from "../services/api";
import "../styles/overlay.css";

export default function PostLogin() {
  const { user, token, setGrupoActivo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !user) return;

    const validarAcceso = async () => {
      try {
        const role = user.role;

        // 0. NUEVO: Si es superadmin, debe elegir empresa primero
        if (role === "superadmin") {
          navigate("/seleccionar-empresa"); // Esta ruta la crearemos ahora
          return;
        }

        // 1. Si es admin, va directo al panel de control
        if (role === "admin") {
          navigate("/admin");
          return;
        }

        // 2. Intentamos obtener la tarea asignada específicamente para este operario
        try {
          const resAsignacion = await api.get("/api/asignacion/mi-tarea");
          const tarea = resAsignacion.data;

          if (tarea) {
            // Mapeamos los datos para que coincidan EXACTAMENTE con el tipo 'ConteoGrupo'
            setGrupoActivo({
              id: tarea.conteo_grupo_id,
              descripcion: tarea.grupo_nombre,
              fecha: "", // Agregamos fecha vacía para evitar el error de TS
              activo: 1, // Sabemos que está activo porque la consulta SQL así lo filtra
            });

            navigate(`/captura?grupo=${tarea.conteo_grupo_id}`);
            return;
          }
        } catch (err) {
          if (axios.isAxiosError(err)) {
            if (err.response?.status !== 404) {
              console.error("Error al buscar asignación:", err);
            }
          } else {
            console.error("Error inesperado:", err);
          }
        }

        // 3. FLUJO MANUAL (Si no tiene asignación específica):
        // Buscamos todos los grupos activos para que elija uno
        const response = await api.get("/api/conteos/grupos/activos");
        const grupos = Array.isArray(response.data) ? response.data : [];

        if (grupos.length === 0) {
          navigate("/sin-grupos");
          return;
        }

        if (grupos.length === 1) {
          setGrupoActivo(grupos[0]);
          navigate(`/captura?grupo=${grupos[0].id}`);
          return;
        }

        // Si hay varios y no tiene asignación, que elija
        navigate("/seleccionar-grupo");
      } catch (error) {
        console.error("Error en el flujo de PostLogin:", error);
        navigate("/");
      }
    };

    validarAcceso();
  }, [token, user, navigate, setGrupoActivo]);

  return (
    <div className="overlay-mask-spinner">
      <ProgressSpinner
        style={{ width: "80px", height: "80px" }}
        strokeWidth="6"
      />
      <p>Cargando información de tu tarea...</p>
    </div>
  );
}
