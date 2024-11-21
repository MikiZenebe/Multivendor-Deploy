// OrderSuccess.js
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const OrderSuccess = () => {
  const [loader, setLoader] = useState(true);
  const [message, setMessage] = useState(null);

  // Get the transaction_id from the URL query parameters
  useEffect(() => {
    const transactionId = new URLSearchParams(window.location.search).get(
      "transaction_id"
    );
    if (transactionId) {
      verifyPayment(transactionId);
    } else {
      setMessage("failed");
    }
  }, []);

  // Function to verify the payment with Chapa
  const verifyPayment = async (transactionId) => {
    try {
      const response = await axios.get(
        `https://multivendor-server-z8kg.onrender.com/api/order/chapa/verify/${transactionId}`
      );
      if (response.data.status === "paid") {
        setMessage("succeeded");
        updatePaymentStatus();
      } else {
        setMessage("failed");
      }
    } catch (error) {
      console.log("Error verifying payment:", error);
      setMessage("failed");
    }
  };

  // Function to update payment status in the backend
  const updatePaymentStatus = async () => {
    const orderId = localStorage.getItem("orderId");
    if (orderId) {
      try {
        await axios.get(
          `https://multivendor-server-z8kg.onrender.com/api/order/confirm/${orderId}`
        );
        localStorage.removeItem("orderId");
        setLoader(false);
      } catch (error) {
        console.log("Error updating payment status:", error);
        setMessage("failed");
      }
    }
  };

  return (
    <div>
      <div className="bg-gray-100 h-screen">
        <div className="bg-white p-6  md:mx-auto">
          <svg
            viewBox="0 0 24 24"
            className="text-green-600 w-16 h-16 mx-auto my-6"
          >
            <path
              fill="currentColor"
              d="M12,0A12,12,0,1,0,24,12,12.014,12.014,0,0,0,12,0Zm6.927,8.2-6.845,9.289a1.011,1.011,0,0,1-1.43.188L5.764,13.769a1,1,0,1,1,1.25-1.562l4.076,3.261,6.227-8.451A1,1,0,1,1,18.927,8.2Z"
            ></path>
          </svg>
          <div className="text-center">
            <h3 className="md:text-2xl text-base text-gray-900 font-semibold text-center">
              Payment Done!
            </h3>
            <p className="text-gray-600 my-2">
              Your order has been successfully processed.
            </p>
            <p>Thank You </p>
            <div className="py-10 text-center">
              <Link
                to="/dashboard/my-orders"
                className="px-12 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3"
              >
                GO BACK
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
