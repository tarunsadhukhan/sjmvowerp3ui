import axios from "axios";
import Swal from "sweetalert2";
//import * as dotenv from "dotenv";
//dotenv.config({ path: "env/api.env" });

//import path from "path";

// Load environment variables from env/api.env
//dotenv.config({ path: path.resolve(__dirname, "/env/api.env") });
const API_URL = process.env.NEXT_PUBLIC_API_URL

console.log('nnnnn',API_URL)

//|| "http://localhost:8000";

//process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  

export const login = async (
  username: string,
  password: string,
  logintype: string,
  rememberMe: boolean
) => {
  try {
   // const subdomain = window.location.hostname.split(".")[0]; // ✅ Extract subdomain dynamically
    const subdomain = "vowsls3.vowerp.co.in"; // ✅ Extract subdomain dynamically
    console.log('hdhdh',subdomain)
    const response = await axios.post(
      `${API_URL}/api/authRoutes/login`,
      {
        username,
        password,
        logintype,
        rememberMe
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Subdomain": subdomain, // ✅ Send subdomain in request headers
        },
      }
    );
    if (response.data.status_code === 200) {
      return response.data;
    } else {
     // throw new Error(response.data.message || "Login failed");
    Swal.fire({
      title: "Error",
      text: response.data.message,
      icon: "error",
      confirmButtonText: "OK",
    });
    return response.data;
    }
  //  return response.data;
  } catch (error: unknown) {
    console.error("Login failed:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        Swal.fire({
          title: "Error",
          text: error.response.data.detail,
          icon: "error",
          confirmButtonText: "OK",
        });
      } else if (error.response?.status === 401)
      { Swal.fire({
        title: "Login Failed",
        text: "Invalid Username or password.",
        icon: "error",
        confirmButtonText: "OK",
      }); } else {
        Swal.fire({
          title: "Login Failed",
          text: "Something went wrong. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }

      throw new Error(error.response?.data?.detail || "Login request failed");
    } else {
      throw new Error("Login request failed");
    }
  }
};

export const getProtectedData = async () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const response = await axios.get(`${API_URL}/api/authRoutes/protected`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("Access denied:", error);
    return null;
  }
};
