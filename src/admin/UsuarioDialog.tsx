import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Password } from "primereact/password";
import { useEffect, useRef, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { AxiosError } from "axios";

// Definimos la interfaz aquí también para que coincida exactamente
export interface UsuarioRow {
  id?: number;
  username: string;
  role: "admin" | "user" | "superadmin";
  empresa_id?: number;
  empresa?: string | null;
}

interface EmpresaOption {
  id: number;
  nombre: string;
}

interface Props {
  visible: boolean;
  usuario: UsuarioRow | null;
  onHide: () => void;
  onSuccess: () => void;
  toastRef: React.RefObject<Toast | null>;
}

export default function UsuarioDialog({
  visible,
  usuario,
  onHide,
  onSuccess,
  toastRef,
}: Props) {
  const toast = useRef<Toast>(null);
  const authContext = useContext(AuthContext);
  const me = authContext?.user;
  const esEdicion = !!usuario;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user" | "superadmin">("user");
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    // Si soy superadmin, necesito la lista de empresas
    if (me?.role === "superadmin") {
      api.get("/api/admin/empresas").then((res) => setEmpresas(res.data));
    }

    if (usuario) {
      setUsername(usuario.username);
      setRole(usuario.role);
      setEmpresaId(usuario.empresa_id || null);
      setPassword("");
      setConfirmPassword("");
    } else {
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setRole("user");
      // Si soy admin normal, heredo mi empresa. Si soy superadmin, empiezo en null.
      setEmpresaId(me?.role === "superadmin" ? null : me?.empresa_id || null);
    }
  }, [usuario, me]);

  const guardar = async () => {
    if (!username.trim() || (!esEdicion && !password.trim())) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Faltan datos obligatorios",
      });
      return;
    }

    // Validación: El superadmin debe elegir una empresa si el rol creado es admin o user
    if (me?.role === "superadmin" && role !== "superadmin" && !empresaId) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Seleccione una empresa para el usuario",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Las contraseñas no coinciden",
      });
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        username,
        role,
        empresa_id: me?.role === "superadmin" ? empresaId : me?.empresa_id,
        password: password || undefined,
      };

      if (esEdicion) {
        await api.put(`/api/admin/usuarios/${usuario!.id}`, payload);
      } else {
        await api.post("/api/admin/usuarios", payload);
      }

      toastRef.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Usuario guardado correctamente",
      });
      onSuccess();
      onHide();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: axiosError.response?.data?.message || "Error al guardar",
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog
      header={esEdicion ? "Editar Usuario" : "Nuevo Usuario"}
      visible={visible}
      modal
      className="p-fluid"
      style={{ width: "500px" }} // Un poco más ancho para el doble campo
      onHide={onHide}
      footer={
        <div className="flex justify-content-end gap-2 mt-3">
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
      <div className="grid mt-2">
        {/* Usuario y Rol */}
        <div className="col-12 md:col-7 field">
          <label htmlFor="username" className="font-bold block mb-2">
            Usuario
          </label>
          <InputText
            id="username"
            value={username}
            disabled={esEdicion}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ej: daniel.perez"
          />
        </div>

        <div className="col-12 md:col-5 field">
          <label htmlFor="role" className="font-bold block mb-2">
            Rol
          </label>
          <Dropdown
            id="role"
            value={role}
            options={[
              {
                label: "Superadmin",
                value: "superadmin",
                disabled: me?.role !== "superadmin",
              },
              { label: "Admin", value: "admin" },
              { label: "Usuario", value: "user" },
            ]}
            onChange={(e) => setRole(e.value)}
          />
        </div>

        {/* Contraseña */}
        <div className="col-12 md:col-6 field">
          <label
            htmlFor="password"
            title={esEdicion ? "Dejar vacío para no cambiar" : ""}
            className="font-bold block mb-2"
          >
            {esEdicion ? "Nueva Contraseña" : "Contraseña"}
          </label>
          <Password
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            toggleMask
            placeholder="******"
          />
        </div>

        {/* Confirmar Contraseña */}
        <div className="col-12 md:col-6 field">
          <label htmlFor="confirmPassword" className="font-bold block mb-2">
            Confirmar
          </label>
          <Password
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            toggleMask
            placeholder="******"
          />
        </div>

        {/* Empresa */}
        <div className="col-12 field">
          <label className="font-bold block mb-2 text-primary">
            Empresa Asignada
          </label>
          {me?.role === "superadmin" && role !== "superadmin" ? (
            <Dropdown
              value={empresaId}
              options={empresas}
              optionLabel="nombre"
              optionValue="id"
              onChange={(e) => setEmpresaId(e.value)}
              placeholder="Seleccionar empresa para el usuario..."
              filter
              className="border-primary"
            />
          ) : (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon bg-blue-50">
                <i className="pi pi-building text-primary"></i>
              </span>
              <InputText
                value={
                  role === "superadmin"
                    ? "ACCESO GLOBAL"
                    : usuario?.empresa || me?.empresa_nombre || ""
                }
                disabled
                className="bg-gray-100"
              />
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
