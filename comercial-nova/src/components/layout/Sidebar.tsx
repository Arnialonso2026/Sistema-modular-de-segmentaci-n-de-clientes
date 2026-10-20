
import { NavLink } from "react-router-dom";
import { Activity, PanelLeftClose } from "lucide-react";
import { navigationItems } from "../../app/navigation";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="brand-mark">
          <Activity size={23} />
        </div>

        <div className="brand-copy">
          <span className="brand-name">Nova</span>
          <span className="brand-caption">CUSTOMER INTELLIGENCE</span>
        </div>

        <PanelLeftClose
          className="sidebar__decoration"
          size={18}
          aria-hidden="true"
        />
      </div>

      <div className="sidebar__section-label">
        ESPACIO DE TRABAJO
      </div>

      <nav className="sidebar__navigation" aria-label="Navegación principal">
        {navigationItems.map(({ label, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              `nav-item${isActive ? " nav-item--active" : ""}`
            }
          >
            <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__footer-indicator" />
        <div>
          <p className="sidebar__footer-title">Sistema analítico</p>
          <p className="sidebar__footer-text">Entorno de desarrollo</p>
        </div>
      </div>
    </aside>
  );
}
