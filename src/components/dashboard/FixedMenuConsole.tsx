'use client';
import Link from "next/link";
import { Users, LogOut,  Key } from "lucide-react";
import {  useState } from "react"
import { useRouter } from "next/navigation"
 

export function FixedMenuConsole({ isCollapsed }: { isCollapsed: boolean }) {
 
  const [open, setOpen] = useState(false);
  const router = useRouter()
   

const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault(); // Prevent default navigation behavior
  console.log("Logging out...");
  localStorage.removeItem("user");  // Remove user data
  localStorage.removeItem("jwtToken"); 
  // Clear localStorage
  localStorage.removeItem("user");
  localStorage.removeItem("jwtToken");
  localStorage.clear();
  console.log(localStorage.user,'for user')
  // Redirect to login page manually
  router.push("/");
};

  return (
    <div className="border-t border-[#005580] mt-2">
      <div
        className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#005580] transition-colors cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <Users size={20} className="mr-2" />
        {!isCollapsed && "User Settings"}
      </div>

      {open && !isCollapsed && (
        <div className="ml-4 border-l border-[#005580]">
          <Link href="/" className="block px-4 py-2 text-white hover:bg-[#005580]" onClick={handleLogout}>
            <LogOut size={16} className="mr-2 inline" /> Logout
          </Link>
          <Link href="/reset-password" className="block px-4 py-2 text-white hover:bg-[#005580]">
            <Key size={16} className="mr-2 inline" /> Reset Password
          </Link>

        </div>
      )}
    </div>
  );
}
