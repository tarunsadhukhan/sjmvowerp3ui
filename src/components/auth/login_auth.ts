import axios from "axios";
import Swal from "sweetalert2";
import apiRoutes from "@/utils/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

console.log('nnnnn', API_URL);

export const login = async (
  username: string,
  password: string,
  logintype: string,
  rememberMe: boolean
) => {
  try {
    // const subdomain = window.location.hostname.split(".")[0]; // ✅ Extract subdomain dynamically
    const subdomain = "vowsls3.vowerp.co.in"; // ✅ Extract subdomain dynamically
    console.log('hdhdh', subdomain);

    // Commented out axios call for multi-tenancy
    /*
    const response = await axios.post(
      apiRoutes.USERLOGINCONSOLE,
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
    */

    // Simulate response for now
    const response = { data: { status_code: 200, message: "Success" } };

    if (response.data.status_code === 200) {
      return response.data;
    } else {
      Swal.fire({
        title: "Error",
        text: response.data.message,
        icon: "error",
        confirmButtonText: "OK",
      });
      return response.data;
    }
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
      } else if (error.response?.status === 401) {
        Swal.fire({
          title: "Login Failed",
          text: "Invalid Username or password.",
          icon: "error",
          confirmButtonText: "OK",
        });
      } else {
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

export const loginConsole = async (
  username: string,
  password: string,
  logintype: string,
  rememberMe: boolean
) => {
  try {
    const subdomain = (window.location.hostname).split(".")[0];
    console.log('Subdomain:', subdomain);

    const requestData = {
      username,
      password,
      logintype,
      rememberMe,
    };

    console.log("API Request Data:", requestData);

    const response = await axios.post(
      apiRoutes.SUPERADMINLOGINCONSOLE,
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Subdomain": subdomain,
        },
        withCredentials: true, // Ensure cookies are sent and received
      }
    );

    console.log("API Response:", response); // Log the full response

    // Check if the cookie is set
    const cookies = document.cookie;
    console.log("Cookies after login:", cookies);

    if (response.status === 200) {
      console.log("Login successful");
      return {
        status: response.status,
        ...response.data
      };
    } else {
      throw new Error("Unexpected response status");
    }
  } catch (error: unknown) {
    console.error("Login failed:", error);

    if (axios.isAxiosError(error)) {
      console.error("Axios Error Details:", error.toJSON()); // Log detailed Axios error
    }

    throw new Error("Login request failed");
  }
};

export const getProtectedData = async () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const response = await axios.get(apiRoutes.PROTECTED, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("Access denied:", error);
    return null;
  }
};
