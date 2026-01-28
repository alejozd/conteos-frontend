import { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import {
  InputSwitch,
  type InputSwitchChangeEvent,
} from "primereact/inputswitch";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import api from "../services/api";

// Interfaz estricta para el modelo
interface Empresa {
  id?: number;
  nombre: string;
  nit: string;
  descripcion: string;
  activo: number;
}

export default function EmpresasAdmin() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaDialog, setEmpresaDialog] = useState<boolean>(false);
  const [empresa, setEmpresa] = useState<Empresa>({
    nombre: "",
    nit: "",
    descripcion: "",
    activo: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const toast = useRef<Toast>(null);

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await api.get<Empresa[]>("/api/admin/empresas");
      setEmpresas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error al cargar empresas:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar las empresas",
      });
    } finally {
      setLoading(false);
    }
  };

  const openNew = (): void => {
    setEmpresa({ nombre: "", nit: "", descripcion: "", activo: 1 });
    setEmpresaDialog(true);
  };

  const editEmpresa = (emp: Empresa): void => {
    setEmpresa({ ...emp });
    setEmpresaDialog(true);
  };

  const saveEmpresa = async (): Promise<void> => {
    if (!empresa.nombre.trim() || !empresa.nit.trim()) return;

    try {
      if (empresa.id) {
        await api.put(`/api/admin/empresas/${empresa.id}`, empresa);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Empresa actualizada correctamente",
        });
      } else {
        await api.post("/api/admin/empresas", empresa);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Empresa registrada con éxito",
        });
      }
      setEmpresaDialog(false);
      fetchEmpresas();
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al procesar la solicitud",
      });
    }
  };

  const statusBodyTemplate = (rowData: Empresa) => {
    const isActive = rowData.activo === 1;
    return (
      <Tag
        value={isActive ? "ACTIVO" : "INACTIVO"}
        severity={isActive ? "success" : "danger"}
        style={{ borderRadius: "6px" }}
      />
    );
  };

  const actionBodyTemplate = (rowData: Empresa) => (
    <div className="flex justify-content-center">
      <Button
        icon="pi pi-pencil"
        rounded
        text
        severity="info"
        onClick={() => editEmpresa(rowData)}
        tooltip="Editar Empresa"
      />
    </div>
  );

  const header = (
    <div className="flex flex-column gap-3">
      {/* FILA SUPERIOR: Título y Botón Nueva */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
        <div className="flex align-items-center gap-3">
          <i className="pi pi-building text-primary text-3xl" />
          <h2 className="m-0 text-3xl font-bold text-900 tracking-tight text-white">
            Gestión de Empresas
          </h2>
        </div>

        <Button
          label="Nueva Empresa"
          icon="pi pi-plus"
          severity="success"
          className="p-button-sm shadow-2"
          onClick={openNew}
        />
      </div>

      {/* FILA INFERIOR: Buscador con IconField corregido */}
      <div className="flex align-items-center bg-gray-900 p-3 border-round border-1 border-gray-800">
        <div className="flex flex-column md:flex-row md:align-items-center gap-3 w-full">
          <div className="flex-1">
            <IconField iconPosition="left">
              <InputIcon className="pi pi-search text-gray-400" />
              <InputText
                value={globalFilter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setGlobalFilter(e.target.value)
                }
                placeholder="Buscar por nombre, NIT o descripción..."
                className="w-full p-inputtext-sm bg-gray-800 border-gray-700 text-gray-100"
              />
            </IconField>
          </div>

          <div className="hidden md:flex align-items-center gap-2 bg-gray-800 px-3 py-2 border-round-xl border-1 border-gray-700">
            <span className="text-sm text-gray-400 font-medium">
              Registradas:
            </span>
            <span className="text-lg font-bold text-blue-400">
              {empresas.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="card shadow-4 border-round-xl overflow-hidden"
      style={{ background: "#111827", border: "1px solid #1f2937" }}
    >
      <Toast ref={toast} />

      <DataTable
        value={empresas}
        loading={loading}
        header={header}
        globalFilter={globalFilter}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        className="p-datatable-sm mt-2"
        emptyMessage="No se encontraron empresas registradas."
        stripedRows
        showGridlines
        responsiveLayout="stack"
        breakpoint="960px"
      >
        <Column
          field="nit"
          header="NIT"
          sortable
          style={{ width: "15%" }}
          className="font-mono"
        />
        <Column
          field="nombre"
          header="Nombre"
          sortable
          style={{ width: "30%" }}
        />
        <Column
          field="descripcion"
          header="Descripción"
          style={{ width: "35%" }}
        />
        <Column
          field="activo"
          header="Estado"
          body={statusBodyTemplate}
          sortable
          style={{ width: "10%" }}
        />
        <Column
          body={actionBodyTemplate}
          header="Acciones"
          style={{ width: "10%" }}
        />
      </DataTable>

      <Dialog
        visible={empresaDialog}
        style={{ width: "90vw", maxWidth: "450px" }}
        header={empresa.id ? "Editar Empresa" : "Nueva Empresa"}
        modal
        className="p-fluid"
        onHide={() => setEmpresaDialog(false)}
        draggable={false}
        resizable={false}
      >
        <div className="flex flex-column gap-3 mt-2">
          <div className="field">
            <label
              htmlFor="nombre"
              className="font-bold block mb-2 text-gray-200"
            >
              Nombre Legal
            </label>
            <InputText
              id="nombre"
              value={empresa.nombre}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmpresa({ ...empresa, nombre: e.target.value })
              }
              placeholder="Ej: Mi Empresa S.A.S"
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="nit" className="font-bold block mb-2 text-gray-200">
              NIT / Identificación
            </label>
            <InputText
              id="nit"
              value={empresa.nit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmpresa({ ...empresa, nit: e.target.value })
              }
              placeholder="900.000.000-1"
            />
          </div>

          <div className="field">
            <label
              htmlFor="descripcion"
              className="font-bold block mb-2 text-gray-200"
            >
              Descripción Breve
            </label>
            <InputTextarea
              id="descripcion"
              value={empresa.descripcion}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setEmpresa({ ...empresa, descripcion: e.target.value })
              }
              rows={3}
              autoResize
            />
          </div>

          <div className="flex align-items-center gap-3 bg-gray-800 p-3 border-round">
            <label htmlFor="activo" className="font-bold text-gray-200 flex-1">
              Empresa Activa
            </label>
            <InputSwitch
              id="activo"
              checked={empresa.activo === 1}
              onChange={(e: InputSwitchChangeEvent) =>
                setEmpresa({ ...empresa, activo: e.value ? 1 : 0 })
              }
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            text
            severity="danger"
            onClick={() => setEmpresaDialog(false)}
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            severity="success"
            onClick={saveEmpresa}
            disabled={!empresa.nombre.trim() || !empresa.nit.trim()}
          />
        </div>
      </Dialog>
    </div>
  );
}
