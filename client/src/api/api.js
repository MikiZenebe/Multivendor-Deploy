import axios from "axios";
const local = import.meta.env.VITE_API_URL;
const production = "";
const api = axios.create({
  baseURL: `${local}/api`,
  withCredentials: true,
});
export default api;
