import { privateRoutes } from "./privateRoutes";
import MainLayout from "../../layout/MainLayout";
import ProtectRoute from "./ProtectRoute";

export const getRoutes = () => {
  // Map over privateRoutes and wrap each route's element with ProtectRoute
  const updatedRoutes = privateRoutes.map((r) => {
    return {
      ...r, // Spread the existing route properties
      element: <ProtectRoute route={r}>{r.element}</ProtectRoute>, // Wrap the element
    };
  });

  return {
    path: "/",
    element: <MainLayout />,
    children: updatedRoutes, // Use updatedRoutes here
  };
};
