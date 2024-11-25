/* eslint-disable react/prop-types */
import Success from "../../views/Success";
import Login from "../../views/auth/Login";
import Register from "../../views/auth/Register";
import AdminLogin from "../../views/auth/AdminLogin";
import Home from "../../views/Home";
import UnAuthorized from "../../views/UnAuthorized";
import { useSelector } from "react-redux";

// eslint-disable-next-line react-refresh/only-export-components
const PublicRoute = ({ element, restricted }) => {
  const userInfo = useSelector(
    (state) => state.auth.userInfo,
    (prev, next) => prev === next
  );

  // Redirect to Home if user is authenticated and accessing restricted routes (like login/register)
  if (userInfo && restricted) {
    return <Home />; // Render the Home component directly instead of navigating
  }

  return element;
};

const publicRoutes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <PublicRoute element={<Login />} restricted={true} />, // restricted for authenticated users
  },
  {
    path: "/register",
    element: <PublicRoute element={<Register />} restricted={true} />, // restricted for authenticated users
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
