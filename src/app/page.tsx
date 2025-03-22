"use client"; // Ensure this component runs only on the client

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname; // Get the hostname
      const subdomainPart = hostname.split(".")[0]; // Extract the subdomain
      console.log("Detected Subdomain:", subdomainPart); // Log the subdomain
      setSubdomain(subdomainPart !== "localhost" ? subdomainPart : null); // Set subdomain if not localhost

      const userCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("user="))
        ?.split("=")[1];

      if (userCookie) {
        const user = JSON.parse(decodeURIComponent(userCookie));
        if (subdomainPart === "admin") {
          router.push("/dashboardctrldesk");
        } else {
          router.push("/dashboardportal");
        }
      }
    }
  }, [router]);

  return (
    <main className="min-h-screen flex">
      {/* Left side - Welcome Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-800 to-teal-600 p-12 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/background.png')" }}
        ></div>

        {/* Centering the text */}
        <div className="relative flex flex-col items-center justify-center w-full h-full text-white z-10">
          <h1 className="text-2xl font-bold text-center mb-12">
            Nice to meet you
          </h1>
          <h2 className="text-6xl font-bold text-center mb-12">WELCOME</h2>
          <p className="text-xm text-center">
            We have customized this product according to your needs and can&apos;t
            wait to see you using this product. This will simplify the working of
            your business.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="VOW Logo"
              width={200}
              height={100}
              priority
            />
          </div>
          <LoginForm subdomain={subdomain} />
        </div>
      </div>
    </main>
  );
}
