// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SessionProvider } from "./context/SessionContext.jsx";
import { SWRConfig } from "swr";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <SWRConfig>
    <SessionProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SessionProvider>
  </SWRConfig>
  // </StrictMode>
);
