// src/components/ConteoOperario.tsx
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef } from "react";

export default function ConteoOperario() {
  const { grupoActivo, token } = useAuth();
  const [codigo, setCodigo] = useState("");
  const [cantidad, setCantidad] = useState("");

  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  if (!grupoActivo) return null;

  const guardar = async () => {
    if (!codigo.trim() || !cantidad.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Datos incompletos",
        detail: "Debes ingresar código y cantidad"
      });
      return;
    }

    try {
      const res = await fetch("https://conteosapi.zdevs.uk/api/conteos/guardar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          grupo_id: grupoActivo.id,
          codigo,
          cantidad: Number(cantidad)
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      toast.current?.show({
        severity: "success",
        summary: "Guardado",
        detail: "Registro almacenado"
      });

      setCodigo("");
      setCantidad("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: message
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Toast ref={toast} />

      <Card className="w-full max-w-lg p-8">
        <h2 className="text-2xl font-bold mb-2">
          Conteo: {grupoActivo.descripcion}
        </h2>
        <p className="text-sm mb-6 text-gray-600">
          Fecha: {grupoActivo.fecha}
        </p>

        <div className="mb-4">
          <label>Código del producto</label>
          <InputText
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="mb-6">
          <label>Cantidad</label>
          <InputText
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="w-full"
          />
        </div>

        <Button
          label="Guardar"
          icon="pi pi-save"
          className="w-full mb-4"
          onClick={guardar}
        />

        <Button
          label="Cambiar de conteo"
          icon="pi pi-external-link"
          className="w-full p-button-secondary"
          onClick={() => navigate("/seleccionar-grupo")}
        />
      </Card>
    </div>
  );
}
