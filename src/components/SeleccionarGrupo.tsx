// src/components/SeleccionarGrupo.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ListBox } from "primereact/listbox";
import { ProgressSpinner } from "primereact/progressspinner";

type Grupo = {
  id: number;
  fecha: string;
  descripcion: string;
  activo: number;
};

export default function SeleccionarGrupo() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [selected, setSelected] = useState<Grupo | null>(null);
  const [loading, setLoading] = useState(true);

  const { setGrupoActivo, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadGrupos() {
      try {
        const res = await fetch("https://conteosapi.zdevs.uk/api/conteos/grupos/activos", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json() as Grupo[];
        setGrupos(data);

        if (data.length === 1) {
          setGrupoActivo(data[0]);
          navigate("/captura");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadGrupos();
  }, []);

  const handleContinuar = () => {
    if (!selected) return;
    setGrupoActivo(selected);
    navigate("/captura");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <ProgressSpinner />
      </div>
    );

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-gray-100">
      <Card className="w-full max-w-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Selecciona el grupo de conteo
        </h1>

        <ListBox
          value={selected}
          options={grupos}
          optionLabel="descripcion"
          onChange={(e) => setSelected(e.value)}
          className="w-full mb-4"
        />

        <Button
          label="Continuar"
          icon="pi pi-check"
          className="w-full"
          onClick={handleContinuar}
          disabled={!selected}
        />
      </Card>
    </div>
  );
}
