import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

export default function PostLogin() {
  const { user, token, setGrupoActivo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !user) return;

    const validarRol = async () => {
      try {      
        const role = user.role;
        //console.log("Rol:", role);

        // Llamamos al endpoint correcto
        const response = await api.get("/api/conteos/grupos/activos");

        const grupos = response.data || [];
        //console.log("Grupos activos:", grupos);

        // Si es admin
        if (role === "admin") {
          navigate("/admin");
          return;
        }

        // Si es user
        if (grupos.length === 0) {
          navigate("/sin-grupos");
          return;
        }

        if (grupos.length === 1) {
          setGrupoActivo(grupos[0].id); // lo guardamos en el contexto
          navigate(`/captura?grupo=${grupos[0].id}`);
          return;
        }

        // Si hay varios grupos activos
        navigate("/seleccionar-grupo");

      } catch (error) {
        console.error("Error al obtener grupos activos:", error);
        navigate("/");
      }
    };

    validarRol();
  }, [token, user, navigate, setGrupoActivo]);

  return <div>Cargando...</div>;
}
