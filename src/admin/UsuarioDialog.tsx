// src/admin/UsuarioDialog.tsx
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

interface UsuarioRow {
  id?: number;
  username: string;
  role: "admin" | "user";
  empresa_id?: number;
  empresa?: string | null;
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
  const [guardando, setGuardando] = useState(false);

  const authContext = useContext(AuthContext);
  const adminLogueado = authContext?.user;

  // Priorizamos el nombre que venga del registro, si no, el del admin logueado
  const nombreEmpresa =
    esEdicion && usuario?.empresa
      ? usuario.empresa
      : adminLogueado?.empresa_nombre || "Mi Empresa";

  useEffect(() => {
    if (usuario) {
      setUsername(usuario.username);
      setRole(usuario.role);
      setPassword("");
    } else {
      setUsername("");
      setPassword("");
      setRole("user");
    }
  }, [usuario, visible]);

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

      // Siempre usamos el empresa_id del administrador para nuevos, o el del usuario para edición
      const idEmpresaFinal = esEdicion
        ? usuario?.empresa_id
        : adminLogueado?.empresa_id;

      const payload = {
        role,
        empresa_id: idEmpresaFinal,
        password: password || undefined,
      };

      if (esEdicion) {
        await api.put(`/api/admin/usuarios/${usuario!.id}`, payload);
      } else {
        await api.post("/api/admin/usuarios", {
          ...payload,
          username,
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
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al guardar";
      toast.current?.show({ severity: "error", summary: "Error", detail: msg });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog
      header={esEdicion ? "Editar usuario" : "Nuevo usuario"}
      visible={visible}
      modal
      style={{ width: "90vw", maxWidth: "500px" }}
      onHide={onHide}
      footer={
        <div className="flex justify-content-end gap-2">
          <Button
            label="Cancelar"
            className="p-button-text"
            onClick={onHide}
            severity="danger"
          />
          <Button
            label="Guardar"
            loading={guardando}
            onClick={guardar}
            severity="success"
          />
        </div>
      }
    >
      <Toast ref={toast} />

      <div className="grid p-fluid mt-3">
        {/* Usuario - Ancho completo */}
        <div className="col-12 mb-4">
          <span className="p-float-label">
            <InputText
              id="username"
              value={username}
              disabled={esEdicion}
              onChange={(e) => setUsername(e.target.value)}
            />
            <label htmlFor="username">Usuario</label>
          </span>
        </div>

        {/* Contraseña - Ancho completo */}
        <div className="col-12 mb-4">
          <span className="p-float-label">
            <InputText
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={esEdicion ? "Dejar vacío para no cambiar" : ""}
            />
            <label htmlFor="password">
              {esEdicion ? "Nueva contraseña" : "Contraseña"}
            </label>
          </span>
        </div>

        {/* Rol - Mitad de ancho */}
        <div className="col-12 md:col-5 mb-4">
          <span className="p-float-label">
            <Dropdown
              id="role"
              value={role}
              options={[
                { label: "Administrador", value: "admin" },
                { label: "Usuario", value: "user" },
              ]}
              onChange={(e) => setRole(e.value)}
            />
            <label htmlFor="role">Rol</label>
          </span>
        </div>

        {/* Empresa - Mitad de ancho restante (col-7 para dar más espacio al texto largo) */}
        <div className="col-12 md:col-7 mb-4">
          <label
            htmlFor="empresa"
            className="block text-sm mb-1 text-700 font-semibold"
          >
            Empresa
          </label>
          <div
            className="p-2 border-round surface-200 text-800 font-medium"
            style={{
              minHeight: "38px",
              fontSize: "0.9rem",
              overflowX: "auto",
              whiteSpace: "nowrap",
              border: "1px solid #ced4da",
            }}
          >
            {nombreEmpresa}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
