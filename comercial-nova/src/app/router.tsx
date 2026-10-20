
import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout";
import { DashboardPage } from "../modules/dashboard/DashboardPage";
import { CustomersPage } from "../modules/customers/CustomersPage";
import { SegmentationPage } from "../modules/segmentation/SegmentationPage";
import { RecommendationsPage } from "../modules/recommendations/RecommendationsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "clientes",
        element: <CustomersPage />,
      },
      {
        path: "segmentacion",
        element: <SegmentationPage />,
      },
      {
        path: "recomendaciones",
        element: <RecommendationsPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
