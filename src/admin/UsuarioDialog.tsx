import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { AxiosError } from "axios";

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

  const authContext = useContext(AuthContext);
  const adminLogueado = authContext?.user;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [guardando, setGuardando] = useState(false);

  const nombreEmpresa =
    usuario?.empresa ||
    adminLogueado?.empresa_nombre ||
    "Empresa no identificada";

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

      const targetEmpresaId = esEdicion
        ? usuario?.empresa_id
        : adminLogueado?.empresa_id;

      const payload = {
        role,
        empresa_id: targetEmpresaId,
        password: password || undefined,
      };

      if (esEdicion) {
        await api.put(`/api/admin/usuarios/${usuario!.id}`, payload);
      } else {
        await api.post("/api/admin/usuarios", { ...payload, username });
      }

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: esEdicion
          ? "Usuario actualizado"
          : "Usuario creado correctamente",
      });

      onSuccess();
      onHide();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const msg =
        axiosError.response?.data?.message || "No se pudo guardar el usuario";
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
      className="p-fluid"
      style={{ width: "450px" }}
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
            icon="pi pi-check"
            loading={guardando}
            onClick={guardar}
            severity="success"
          />
        </div>
      }
    >
      <Toast ref={toast} />

      <div className="grid mt-3">
        {/* Fila 1: Usuario y Rol */}
        <div className="col-12 md:col-7 mb-4">
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

        <div className="col-12 md:col-5 mb-4">
          <span className="p-float-label">
            <Dropdown
              id="role"
              value={role}
              options={[
                { label: "Admin", value: "admin" },
                { label: "Usuario", value: "user" },
              ]}
              onChange={(e) => setRole(e.value)}
            />
            <label htmlFor="role">Rol</label>
          </span>
        </div>

        {/* Fila 2: Contraseña */}
        <div className="col-12 mb-4">
          <span className="p-float-label">
            <InputText
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={esEdicion ? "Dejar vacío para mantener actual" : ""}
            />
            <label htmlFor="password">
              {esEdicion ? "Cambiar Contraseña" : "Contraseña"}
            </label>
          </span>
        </div>

        {/* Fila 3: Empresa */}
        <div className="col-12">
          <label
            htmlFor="empresa"
            className="block text-sm font-bold text-700 mb-2"
          >
            Empresa Asignada
          </label>
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon bg-blue-50">
              <i className="pi pi-building text-blue-600"></i>
            </span>
            <InputText
              id="empresa"
              value={nombreEmpresa}
              disabled
              className="p-inputtext-sm text-900 shadow-none"
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
