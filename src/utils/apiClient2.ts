import { useState, useEffect } from "react";
import axios from "axios";

// Regular function for direct API calls
export const fetchWithCookie = async (url: string, method: string = "GET", body?: any) => {
    try {
        const response = await axios({
            url,
            method,
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
            data: body,
        });
        return { data: response.data, error: null };
    } catch (err) {
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