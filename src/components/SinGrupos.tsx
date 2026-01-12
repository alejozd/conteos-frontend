import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function SinGrupos() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleSalir = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex flex-column align-items-center justify-content-center h-screen bg-gray-100 p-4 text-center">
      <i className="pi pi-search text-7xl text-blue-500 mb-4" />
      <h1 className="text-3xl font-bold text-900">Hola, {user?.username}</h1>
      <p className="text-xl text-600 mb-5 max-w-20rem">
        No tienes tareas asignadas y no hay grupos de conteo activos en este
        momento.
      </p>
      <Button
        label="Cerrar sesión"
        icon="pi pi-sign-out"
        onClick={handleSalir}
        className="p-button-raised"
      />
    </div>
  );
}
