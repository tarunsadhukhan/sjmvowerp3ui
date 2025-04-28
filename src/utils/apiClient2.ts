import { useState, useEffect } from "react";
import axios from "axios";

// Regular function for direct API calls
export const fetchWithCookie = async (url: string, method: string = "GET", body?: any) => {
    try {
        // Get cookies from document if we're in browser
        const cookies = typeof document !== 'undefined' ? document.cookie : '';
        console.log(`Making ${method} request to ${url} with cookies:`, cookies);
        
        const response = await axios({
            url,
            method,
            headers: {
                "Content-Type": "application/json",
                // Include any custom headers here if needed
            },
            withCredentials: true, // This ensures cookies are sent with the request
            data: body,
            // Don't reject promises on non-2xx responses
            validateStatus: function (status) {
                return status >= 200 && status < 500; // Only reject on server errors
            }
        });
        
        console.log(`Response from ${url}:`, {
            status: response.status,
            statusText: response.statusText,
            hasData: !!response.data
        });
        
        return { data: response.data, error: null };
    } catch (err) {
        console.error(`Error in fetchWithCookie for ${url}:`, err);
        return { data: null, error: (err as Error).message };
    }
};

// Hook version for components
export const useDataWithCookie = (url: string, method: "GET" | "POST" = "GET", body?: any) => {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            const result = await fetchWithCookie(url, method, body);
            setData(result.data);
            setError(result.error);
            setLoading(false);
        };

        fetchData();
    }, [url, method, body]);

    return { data, error, loading };
};

export default useDataWithCookie;