import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import "./monitoring"; // optional Sentry init (no-op if REACT_APP_SENTRY_DSN not set)
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
