import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineGoogle } from "react-icons/ai";
import { auth } from "../utils/firebase";
import { google_register, messageClear } from "../store/Reducers/authReducer";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function OAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { successMessage, errorMessage } = useSelector((state) => state.auth);

  const handleGoogleClick = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      signInWithPopup(auth, provider).then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);

        const user = result.user;
        const email = user.email;
        const name = user.displayName;
        const password = user.password;

        const data = {
          name,
          email,
          password,
        };
        dispatch(google_register(data));
        console.log("User successfully signed up!");
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage, {
        duration: 5000,
      });
      navigate("/");
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage]);

  return (
    <div>
      <button
        type="submit"
        className="px-8 w-full py-2 border border-[#EA4D1B] text-[#EA4D1B] shadow hover:bg-[#EA4D1B] hover:text-white rounded-md flex justify-center items-center gap-2 mb-3"
        onClick={handleGoogleClick}
      >
        <span>
          <AiOutlineGoogle />
        </span>
        <span>Continue with Google</span>
      </button>
    </div>
  );
}
