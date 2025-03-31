import axios, { Method } from "axios";

interface RequestOptions {
  url: string;
  method?: Method; // 'GET' | 'POST' | 'PUT' | etc.
  data?: Record<string, unknown> | unknown[];
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

export const apiClient = async ({
  url,
  method = "GET",
  data = {},
  headers = {},
  withCredentials = false,
}: RequestOptions) => {
  try {
    const response = await axios({
      url,
      method,
      data,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
      withCredentials,
      validateStatus: () => true, // Always resolve the promise
    });

    return response;
  } catch (error) {
    console.error("API Client Error:", error);
    throw error;
  }
};
