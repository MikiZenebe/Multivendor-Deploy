import axios from "axios";
const api = axios.create({
  baseURL: "https://multivendor-server-z8kg.onrender.com/api",
});
export default api;
