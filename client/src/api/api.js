import axios from "axios";
const local = "https://multivendor-server-z8kg.onrender.com";
const production = "https://multivendor-server-z8kg.onrender.com";
const api = axios.create({
  baseURL: `${production}/api`,
  withCredentials: true,
});
export default api;
