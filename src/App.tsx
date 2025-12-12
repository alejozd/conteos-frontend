// src/App.tsx
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from './hooks/useAuth';
import Login from "./components/Login";
// Temporalmente comentamos los que aún no existen
// import ConteoOperario from "./components/ConteoOperario";
// import DashboardAdmin from "./components/DashboardAdmin";

function Main() {
  const { user} = useAuth();
  // const isAdmin = user?.role === 'admin';

  if (!user) return <Login />;
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">
        Bienvenido, {user.username} ({user.role === 'admin' ? ' (Admin)' : ' (Operario)' })
      </h1>
      <p>Login funcionando al 100%</p>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        <Main />
      </div>
    </AuthProvider>
  );
}

export default App;