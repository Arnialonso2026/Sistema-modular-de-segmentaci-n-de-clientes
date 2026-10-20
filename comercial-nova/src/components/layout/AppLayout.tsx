
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-main">
        <Topbar />

        <main className="main-content">
          <Outlet />
        </main>

        <footer className="app-footer">
          <span>Comercial Nova</span>
          <span>Plataforma de segmentación de clientes</span>
        </footer>
      </div>
    </div>
  );
}
