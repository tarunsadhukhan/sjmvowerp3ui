import Link from "next/link";
import { Users, LogOut, CalendarDays, Key } from "lucide-react";
import { useCompany } from "@/hooks/use-org";
import {  useState } from "react"
import { useRouter } from "next/navigation"

export function FixedMenu({ isCollapsed }: { isCollapsed: boolean }) {
  const { fyYears } = useCompany();
  const [open, setOpen] = useState(false);
  const router = useRouter()
  let compshow=1
  const currentHost = window.location.host; // Gets current domain
  console.log("Detected Host:", currentHost,window.location.href);
  if (currentHost === "admin.vwxxx.co.in" || currentHost === "localhost:3001" ) {
      compshow=1
} else {
     compshow=2
}  

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
          {compshow===2 &&         
          <div className="block px-4 py-2 text-white">
            <CalendarDays size={16} className="mr-2 inline" /> FY Year
            <select className="block w-full mt-2 p-2 bg-[#005580] text-white rounded">
              {fyYears.length > 0 ? (
                fyYears.map((year, index) => <option key={index}>{year.toString()}</option>)
              ) : (
                <option>Loading...</option>
              )}
            </select>
          </div>
          }
        </div>
      )}
    </div>
  );
}
