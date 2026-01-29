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
}

export default function UsuarioDialog({
  visible,
  usuario,
  onHide,
  onSuccess,
}: Props) {
  const toast = useRef<Toast>(null);
  const authContext = useContext(AuthContext);
  const me = authContext?.user;
  const esEdicion = !!usuario;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    } else {
      setUsername("");
      setPassword("");
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

      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Usuario guardado",
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
      header={esEdicion ? "Editar usuario" : "Nuevo usuario"}
      visible={visible}
      modal
      className="p-fluid"
      style={{ width: "450px" }}
      onHide={onHide}
    >
      <Toast ref={toast} />
      <div className="grid mt-3">
        <div className="col-12 md:col-7 mb-4">
          <label htmlFor="username">Usuario</label>
          <InputText
            id="username"
            value={username}
            disabled={esEdicion}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="col-12 md:col-5 mb-4">
          <label htmlFor="role">Rol</label>
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

        <div className="col-12 mb-4">
          <label htmlFor="password">
            {esEdicion ? "Cambiar Contraseña (opcional)" : "Contraseña"}
          </label>
          <Password
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            toggleMask
          />
        </div>

        <div className="col-12">
          <label className="block text-sm font-bold mb-2">
            Empresa Asignada
          </label>
          {me?.role === "superadmin" && role !== "superadmin" ? (
            <Dropdown
              value={empresaId}
              options={empresas}
              optionLabel="nombre"
              optionValue="id"
              onChange={(e) => setEmpresaId(e.value)}
              placeholder="Seleccionar empresa..."
              filter
            />
          ) : (
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-building"></i>
              </span>
              <InputText
                value={
                  role === "superadmin"
                    ? "ACCESO GLOBAL"
                    : usuario?.empresa || me?.empresa_nombre || ""
                }
                disabled
              />
            </div>
          )}
        </div>

        <div className="col-12 flex justify-content-end gap-2 mt-3">
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
      </div>
    </Dialog>
  );
}
