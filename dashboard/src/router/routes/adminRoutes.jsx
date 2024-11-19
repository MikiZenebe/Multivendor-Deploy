import SellerDetails from "../../views/admin/SellerDetails";
import DeactiveSellers from "../../views/admin/DeactiveSellers";
import SellerRequest from "../../views/admin/SellerRequest";
import AdminDashboard from "../../views/admin/AdminDashboard";
import Orders from "../../views/admin/Orders";
import Category from "../../views/admin/Category";
import Sellers from "../../views/admin/Sellers";
import PaymentRequest from "../../views/admin/PaymentRequest";
import ChatSeller from "../../views/admin/ChatSeller";
import OrderDetails from "../../views/admin/OrderDetails";
import AllProducts from "../../views/admin/AllProducts";
import AddBanner from "../../views/seller/AddBanner";
import Banners from "../../views/seller/Banners";

export const adminRoutes = [
  {
    path: "admin/dashboard",
    element: <AdminDashboard />,
    role: "admin",
  },
  {
    path: "admin/dashboard/orders",
    element: <Orders />,
    role: "admin",
  },
  {
    path: "admin/dashboard/category",
    element: <Category />,
    role: "admin",
  },
  {
    path: "admin/dashboard/sellers",
    element: <Sellers />,
    role: "admin",
  },
  {
    path: "/admin/dashboard/add-banner/:productId",
    element: <AddBanner />,
    role: "admin",
  },
  {
    path: "/admin/dashboard/banners",
    element: <Banners />,
    role: "admin",
  },
  {
    path: "admin/dashboard/products",
    element: <AllProducts />,
    role: "admin",
  },

  // {
  //   path: "admin/dashboard/payment-request",
  //   element: <PaymentRequest />,
  //   role: "admin",
  // },
  {
    path: "admin/dashboard/deactive-sellers",
    element: <DeactiveSellers />,
    role: "admin",
  },
  {
    path: "admin/dashboard/sellers-request",
    element: <SellerRequest />,
    role: "admin",
  },
  {
    path: "admin/dashboard/seller/details/:sellerId",
    element: <SellerDetails />,
    role: "admin",
  },
  {
    path: "admin/dashboard/chat-sellers",
    element: <ChatSeller />,
    role: "admin",
  },
  {
    path: "admin/dashboard/chat-sellers/:sellerId",
    element: <ChatSeller />,
    role: "admin",
  },
  {
    path: "admin/dashboard/order/details/:orderId",
    element: <OrderDetails />,
    role: "admin",
  },
];
