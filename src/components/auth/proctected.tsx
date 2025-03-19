import { useEffect, useState } from "react";
import { getProtectedData } from "@/lib/utils";
 

export default function ProtectedPage() {
    const [message, setMessage] = useState("Loading...");

    useEffect(() => {
        getProtectedData().then((res: { message?: string }) => setMessage(res?.message || "Unauthorized"));
    }, []);

    return <h1>{message}</h1>;
}
