import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Logo from "../../assets/logo.png";
import { PropagateLoader } from "react-spinners";
import { useDispatch, useSelector } from "react-redux";
import { overrideStyle } from "../../utils/utils";
import {
  messageClear,
  seller_register,
} from "../../store/Reducers/authReducer";
import OAuth from "../../layout/OAuth";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loader, errorMessage, successMessage } = useSelector(
    (state) => state.auth
  );
  const [state, setSatate] = useState({
    name: "",
    email: "",
    password: "",
  });
  const inputHandle = (e) => {
    setSatate({
      ...state,
      [e.target.name]: e.target.value,
    });
  };
  const submit = (e) => {
    e.preventDefault();
    dispatch(seller_register(state));
  };
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage, {
        duration: 5000,
      });
      navigate("/login");
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage]);
  return (
    <div className="min-w-screen bg-[#F4F4F4] min-h-screen flex justify-center items-center">
      <div className="w-[350px] text-[#d0d2d6] my-10">
        <div className="border bg-white p-8 rounded-md">
          <div className="h-[70px] flex justify-center items-center">
            <div className="w-[180px] h-[50px]">
              <img
                className="w-full h-full object-cover"
                src={Logo}
                alt="image"
              />
            </div>
          </div>
          <p className="text-sm mb-3 text-center text-gray-500">
            Please register to be a Seller
          </p>
          <form onSubmit={submit}>
            <div className="flex flex-col w-full gap-1 mb-3 text-gray-600">
              <label htmlFor="name">Name</label>
              <input
                onChange={inputHandle}
                value={state.name}
                className="px-3 py-2 outline-none border border-[#EA4D1B] bg-transparent rounded-md text-[#1f2229] focus:border-indigo-500 overflow-hidden"
                type="text"
                name="name"
                placeholder="name"
                id="name"
                required
              />
            </div>
            <div className="flex flex-col w-full gap-1 mb-3 text-gray-600">
              <label htmlFor="email">Email</label>
              <input
                onChange={inputHandle}
                value={state.email}
                className="px-3 py-2 outline-none border border-[#EA4D1B] bg-transparent rounded-md text-[#1f2229] focus:border-indigo-500 overflow-hidden"
                type="email"
                name="email"
                placeholder="email"
                id="email"
                required
              />
            </div>
            <div className="flex flex-col w-full gap-1 mb-3 text-gray-600">
              <label htmlFor="password">Password</label>
              <input
                onChange={inputHandle}
                value={state.passwprd}
                className="px-3 py-2 outline-none border border-[#EA4D1B] bg-transparent rounded-md text-[#1f2229] focus:border-indigo-500 overflow-hidden"
                type="password"
                name="password"
                placeholder="password"
                id="password"
                required
              />
            </div>
            <div className="flex items-center w-full gap-3 mb-3">
              <input
                className="w-4 h-4 text-blue-600 overflow-hidden bg-gray-100 rounded border-gray-300 focus:ring-blue-500"
                type="checkbox"
                name="checkbox"
                id="checkbox"
                required
              />
              <label className="text-gray-600" htmlFor="checkbox">
                I agree to privacy policy & terms
              </label>
            </div>
            <button
              disabled={loader ? true : false}
              className="bg-[#EA4D1B] w-full hover:shadow-blue-500/20 hover:shadow-lg text-white rounded-md px-7 py-2 mb-3"
            >
              {loader ? (
                <PropagateLoader color="#fff" cssOverride={overrideStyle} />
              ) : (
                "Signup"
              )}
            </button>
            <div className="flex items-center mb-3 gap-3 justify-center text-gray-600">
              <p>
                Already have an account ?{" "}
                <Link to="/login" className="text-[#EA4D1B] font-bold">
                  Signin here
                </Link>
              </p>
            </div>
            <div className="w-full flex justify-center items-center mb-3">
              <div className="w-[45%] bg-slate-700 h-[1px]"></div>
              <div className="w-[10%] flex justify-center items-center">
                <span className="pb-1 text-gray-600">Or</span>
              </div>
              <div className="w-[45%] bg-slate-700 h-[1px]"></div>
            </div>
            <div className="flex justify-center items-center gap-3">
              <OAuth />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
