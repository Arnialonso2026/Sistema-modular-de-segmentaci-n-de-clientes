
import { Bell, Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar__context">
        <span className="topbar__status" />
        <span>Plataforma de análisis comercial</span>
      </div>

      <div className="topbar__actions">
        <button
          type="button"
          className="icon-button"
          aria-label="Búsqueda global, disponible en una fase posterior"
          title="Búsqueda global"
          disabled
        >
          <Search size={19} />
        </button>

        <button
          type="button"
          className="icon-button"
          aria-label="Notificaciones, disponibles en una fase posterior"
          title="Notificaciones"
          disabled
        >
          <Bell size={19} />
        </button>

        <div className="topbar__divider" />

        <div className="user-avatar" aria-label="Perfil de demostración">
          CN
        </div>
      </div>
    </header>
  );
}
