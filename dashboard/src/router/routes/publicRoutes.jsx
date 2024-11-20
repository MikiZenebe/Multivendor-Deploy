import Success from "../../views/Success";
import Login from "../../views/auth/Login";
import Register from "../../views/auth/Register";
import AdminLogin from "../../views/auth/AdminLogin";
import Home from "../../views/Home";
import UnAuthorized from "../../views/UnAuthorized";

const publicRoutes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },
  {
    path: "/unauthorized",
    element: <UnAuthorized />,
  },
  {
    path: "/success?",
    element: <Success />,
  },
];
export default publicRoutes;
