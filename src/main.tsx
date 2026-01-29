// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PrimeReactProvider, addLocale } from "primereact/api";

// Temas de PrimeReact (orden importante)
// import 'primereact/resources/themes/lara-light-indigo/theme.css';
import "primereact/resources/themes/lara-dark-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

addLocale("es", {
  accept: "Sí",
  reject: "No",
  choose: "Seleccionar",
  upload: "Subir",
  cancel: "Cancelar",
  pending: "Pendiente",
  emptyMessage: "No hay archivos",
  emptyFilterMessage: "No hay resultados",
  weak: "Débil",
  medium: "Medio",
  strong: "Fuerte",
  passwordPrompt: "Ingrese una contraseña",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PrimeReactProvider value={{ locale: "es" }}>
      <App />
    </PrimeReactProvider>
  </React.StrictMode>,
);
