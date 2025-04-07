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





import { useState, useEffect } from "react";
//import getUserDetail from "@/app/utils/getAccessTokenFromCookie";
import axios from "axios";
 
const fetchDataFromAccessToken = (url: string, method: "GET" | "POST" = "GET", body?: any) => {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    
 
    
    
  
    
    useEffect(() => {
        const fetchDataFromAccessToken = async () => {
            try {
  //              const token = getUserDetail();
                const response = await axios({
                    url,
                    method,
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                    data: body,
                });
 
                setData(response.data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
 
        fetchDataFromAccessToken();
    }, [url, method, body]);
 
    return { data, error, loading };
};
 
export default fetchDataFromAccessToken;
 