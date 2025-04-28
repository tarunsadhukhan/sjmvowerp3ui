import axios, { Method, AxiosResponse } from "axios";

interface RequestOptions {
  url: string;
  method?: Method; // 'GET' | 'POST' | 'PUT' | etc.
  data?: Record<string, unknown> | unknown[];
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  error?: string;
  isError: boolean;
}

export const apiClient = async <T = any>({
  url,
  method = "GET",
  data = {},
  headers = {},
  withCredentials = false,
}: RequestOptions): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse = await axios({
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

    // Handle different status codes
    if (response.status >= 200 && response.status < 300) {
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        isError: false,
      };
    } else {
      let errorMessage = "An error occurred";
      
      switch (response.status) {
        case 400:
          errorMessage = response.data.detail || "Bad request";
          break;
        case 401:
          errorMessage = "Unauthorized. Please log in again.";
          // Could trigger authentication flow here
          break;
        case 403:
          errorMessage = "You don't have permission to access this resource";
          break;
        case 404:
          errorMessage = "Resource not found";
          break;
        case 500:
          errorMessage = "Internal server error";
          break;
        default:
          errorMessage = response.data.detail || `Error: ${response.statusText}`;
      }

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        isError: true,
      };
    }
  } catch (error) {
    console.error("API Client Error:", error);
    return {
      data: null as T,
      status: 0,
      statusText: "Network Error",
      error: error instanceof Error ? error.message : "Unknown error occurred",
      isError: true,
    };
  }
};

import { useState, useEffect } from "react";

const fetchDataFromAccessToken = <T = any>(url: string, method: "GET" | "POST" = "GET", body?: any) => {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = ""; // Replace with logic to retrieve the token, e.g., from cookies or local storage
                
                const response = await apiClient<T>({
                    url,
                    method,
                    data: body,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                });
                
                if (response.isError) {
                    throw new Error(response.error);
                }
                
                setData(response.data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [url, method, body]);
    
    return { data, error, loading };
};

export default fetchDataFromAccessToken;
