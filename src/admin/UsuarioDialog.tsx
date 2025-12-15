// src/admin/UsuarioDialog.tsx
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import api from "../services/api";

interface UsuarioRow {
  id?: number;
  username: string;
  role: "admin" | "user";
  empresa_id?: number;
}

interface Props {
  visible: boolean;
  usuario: UsuarioRow | null;
  onHide: () => void;
  onSuccess: () => void;
}

export default function UsuarioDialog({
  visible,
  usuario,
  onHide,
  onSuccess,
}: Props) {
  const toast = useRef<Toast>(null);
  const esEdicion = !!usuario;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (usuario) {
      setUsername(usuario.username);
      setRole(usuario.role);
      setEmpresaId(usuario.empresa_id ?? null);
      setPassword("");
    } else {
      setUsername("");
      setPassword("");
      setRole("user");
      setEmpresaId(null);
    }
  }, [usuario]);

  const guardar = async () => {
    if (!username.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "El usuario es obligatorio",
      });
      return;
    }

    if (!esEdicion && !password.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "La contraseña es obligatoria",
      });
      return;
    }

    try {
      setGuardando(true);

      if (esEdicion) {
        await api.put(`/api/admin/usuarios/${usuario!.id}`, {
          role,
          empresa_id: empresaId,
          password: password || undefined,
        });
      } else {
        await api.post("/api/admin/usuarios", {
          username,
          password,
          role,
          empresa_id: empresaId,
        });
      }

      toast.current?.show({
        severity: "success",
        summary: "OK",
        detail: esEdicion
          ? "Usuario actualizado"
          : "Usuario creado correctamente",
      });

      onSuccess();
      onHide();
    } catch (error) {
        let msg = "No se pudo guardar el usuario";
        if (error instanceof Error) {
            msg = error.message;
        }
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: msg,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
  <Dialog
    header={esEdicion ? "Editar usuario" : "Nuevo usuario"}
    visible={visible}
    modal
    style={{ width: "40vw", maxWidth: "600px" }}
    breakpoints={{ "960px": "75vw", "640px": "95vw" }}
    onHide={onHide}
    footer={
      <div className="flex justify-content-end gap-2">
        <Button
          label="Cancelar"
          className="p-button-text"
          onClick={onHide}
        />
        <Button
          label="Guardar"
          loading={guardando}
          onClick={guardar}
        />
      </div>
    }
  >
    <Toast ref={toast} />

    <div className="grid p-fluid mt-2">
      <div className="col-12">
        <span className="p-float-label">
          <InputText
            value={username}
            disabled={esEdicion}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label>Usuario</label>
        </span>
      </div>

      <div className="col-12">
        <span className="p-float-label">
          <InputText
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              esEdicion ? "Dejar vacío para no cambiar" : ""
            }
          />
          <label>
            {esEdicion ? "Nueva contraseña" : "Contraseña"}
          </label>
        </span>
      </div>

      <div className="col-12 md:col-6">
        <span className="p-float-label">
          <Dropdown
            value={role}
            options={[
              { label: "Administrador", value: "admin" },
              { label: "Usuario", value: "user" },
            ]}
          />
          <label>Rol</label>
        </span>
      </div>

      <div className="col-12 md:col-6">
        <span className="p-float-label">
          <Dropdown
            value={empresaId}
            options={[]}
            placeholder="Seleccione empresa"
            disabled
          />
          <label>Empresa</label>
        </span>
      </div>
    </div>
  </Dialog>
);
}