// src/components/Login.tsx
import { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [username, setUsername] = useState('alejo');
  const [password, setPassword] = useState('Pascal2025*');
  const toast = useRef<Toast>(null);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      toast.current?.show({ severity: 'warn', summary: 'Faltan datos', detail: 'Ingresa usuario y contraseña' });
      return;
    }

    try {
      await login(username, password);
      toast.current?.show({ severity: 'success', summary: '¡Bienvenido!', detail: `Hola ${username}` });
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message });
    }
  };

  return (
    <>
      <Toast ref={toast} position="top-center" />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md"> {/* ← Ancho máximo como móvil en PC */}
          <Card className="shadow-xl">
            <div className="text-center mb-10">
              <i className="pi pi-box text-7xl text-indigo-600 mb-6" />
              <h1 className="text-4xl font-bold text-gray-800">Conteo de Inventario</h1>
              <p className="text-gray-600 mt-3 text-lg">Inicia sesión para comenzar</p>
            </div>

            <div className="space-y-8"> {/* ← Espacio perfecto entre campos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <InputText
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 text-lg"
                  placeholder="Tu usuario"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <InputText
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 text-lg"
                  placeholder="••••••••"
                />
              </div>

              <Button
                label="Iniciar sesión"
                icon="pi pi-sign-in"
                onClick={handleLogin}
                className="w-full h-14 text-xl font-bold bg-indigo-600 hover:bg-indigo-700"
              />
            </div>

            <div className="text-center mt-10 text-sm text-gray-500">
              Metrocerámicas © 2025 • v1.0
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}