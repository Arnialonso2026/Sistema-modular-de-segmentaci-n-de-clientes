
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  Lightbulb,
} from "lucide-react";

export const navigationItems = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Clientes",
    path: "/clientes",
    icon: Users,
    end: false,
  },
  {
    label: "Segmentación",
    path: "/segmentacion",
    icon: BrainCircuit,
    end: false,
  },
  {
    label: "Recomendaciones",
    path: "/recomendaciones",
    icon: Lightbulb,
    end: false,
  },
] as const;
