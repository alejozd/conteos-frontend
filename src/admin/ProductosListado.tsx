import { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { FilterMatchMode } from "primereact/api";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Button } from "primereact/button";
import api from "../services/api";

interface ProductoRow {
  codigo: number;
  subcodigo: number;
  nombre: string;
  referencia: string;
}

export default function ProductosListado() {
  const [data, setData] = useState<ProductoRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const toast = useRef<Toast>(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/productos");
      setData(res.data || []);

      toast.current?.show({
        severity: "success",
        summary: "Productos cargados",
        detail: `Se encontraron ${res.data?.length ?? 0} productos`,
        life: 2500,
      });
    } catch (error) {
      console.error("Error cargando productos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No fue posible cargar los productos",
      });
    } finally {
      setLoading(false);
    }
  };

  const header = (
    <div className="flex justify-content-between align-items-center">
      <h3 className="m-0">Productos importados</h3>

      <div className="flex gap-2">
        <IconField iconPosition="left">
          <InputIcon className="pi pi-search" />
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar..."
          />
        </IconField>
        {globalFilter && (
          <Button
            type="button"
            icon="pi pi-filter-slash"
            label="Limpiar"
            outlined
            onClick={() => setGlobalFilter("")}
          />
        )}
      </div>
    </div>
  );

  const leftToolbarTemplate = () => (
    <Tag value={`Total: ${data.length}`} severity="info" icon="pi pi-box" />
  );

  return (
    <div className="card">
      <Toast ref={toast} />

      <Toolbar className="mb-3" left={leftToolbarTemplate} />

      <DataTable
        value={data}
        loading={loading}
        paginator
        rows={15}
        rowsPerPageOptions={[15, 30, 50]}
        stripedRows
        showGridlines
        globalFilter={globalFilter}
        globalFilterFields={["codigo", "subcodigo", "nombre", "referencia"]}
        emptyMessage="No hay productos para mostrar"
        header={header}
        filterDisplay="menu"
        filters={{
          global: { value: globalFilter, matchMode: FilterMatchMode.CONTAINS },
        }}
      >
        <Column
          field="codigo"
          header="Código"
          sortable
          style={{ width: "10%" }}
        />
        <Column
          field="subcodigo"
          header="Subcódigo"
          sortable
          style={{ width: "10%" }}
        />
        <Column field="nombre" header="Nombre" sortable />
        <Column
          field="referencia"
          header="Referencia"
          sortable
          style={{ width: "20%" }}
        />
      </DataTable>
    </div>
  );
}
