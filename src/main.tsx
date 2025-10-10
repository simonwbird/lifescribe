import React from 'react'
import { createRoot } from "react-dom/client";
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { HelmetProvider } from 'react-helmet-async'
import App from "./App.tsx";
import { AuthProvider } from './contexts/AuthProvider'
import { Toaster } from "@/components/ui/toaster"
import "./index.css";
import "./styles/simpleMode.css";
import "./styles/themes.css";

// Initialize Sentry
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
  })
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
