// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";

import Login from "./components/Login";
import SeleccionarGrupo from "./components/SeleccionarGrupo";
import ConteoOperario from "./components/ConteoOperario";
import PostLogin from "./components/PostLogin";

import AdminLayout from "./admin/AdminLayout";
import DashboardSaldos from "./admin/DashboardSaldos";
import ConteosAnulados from "./admin/ConteosAnulados";
import ImportarSaldos from "./admin/ImportarSaldos";
import UsuariosAdmin from "./admin/UsuariosAdmin";
import ProductosListado from "./admin/ProductosListado";
import BodegasPage from "./admin/BodegasPage";
import UbicacionesPage from "./admin/UbicacionesPage";
import ConteosGruposAdmin from "./admin/ConteosGruposAdmin";
import ComparativaConteos from "./admin/ComparativaConteos";
import AsignacionTareas from "./admin/AsignacionTareas";
import SinGrupos from "./components/SinGrupos";

// function PrivateRoute({ children }: { children: JSX.Element }) {
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/post-login"
            element={
              <PrivateRoute>
                <PostLogin />
              </PrivateRoute>
            }
          />
          <Route
            path="/sin-grupos"
            element={
              <PrivateRoute>
                <SinGrupos />
              </PrivateRoute>
            }
          />

          {/* Flujo operario */}
          <Route
            path="/seleccionar-grupo"
            element={
              <PrivateRoute>
                <SeleccionarGrupo />
              </PrivateRoute>
            }
          />

          <Route
            path="/captura"
            element={
              <PrivateRoute>
                <ConteoOperario />
              </PrivateRoute>
            }
          />

          {/* ================== ADMIN ================== */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            {/* Ruta por defecto /admin */}
            <Route index element={<DashboardSaldos />} />

            <Route path="saldos" element={<DashboardSaldos />} />
            <Route path="conteos-anulados" element={<ConteosAnulados />} />
            <Route
              path="comparativa-conteos"
              element={<ComparativaConteos />}
            />
            <Route path="importar" element={<ImportarSaldos />} />
            <Route path="productos" element={<ProductosListado />} />
            <Route path="usuarios" element={<UsuariosAdmin />} />
            <Route path="bodegas" element={<BodegasPage />} />
            <Route path="ubicaciones" element={<UbicacionesPage />} />
            <Route path="conteos-grupos" element={<ConteosGruposAdmin />} />
            <Route path="asignacion-tareas" element={<AsignacionTareas />} />
          </Route>

          {/* Si ponen cualquier ruta no válida */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
