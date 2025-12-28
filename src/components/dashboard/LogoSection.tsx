'use client';
import Image from "next/image";
// import logo from "@/components/assets/images/logo.png";
import { 
    ChevronLeft,
  } from "lucide-react"
  // import { cn } from "@/utils/protected"
 // import { CompanySelection } from "./CompanySelection";
interface LogoSectionProps {
  isCollapsed: boolean;
  onToggle: () => void;
  logoSrc: string;
  title: string;
}

const LogoSection = ({ isCollapsed, onToggle }: LogoSectionProps) => {
  const handleChangeDashboard = () => {
    window.location.href = "/dashboard";
  };

  return (
        <div className="flex items-center justify-between p-4 border-b border-[#005580]">
        {!isCollapsed && (
          <div className="logoBlock">
                <Image src="/logo.png" 
                height={60}
                width={150}
                alt="Logo"
                className="w-auto h-auto"
                unoptimized
                loading="eager"
                priority
                onClick={handleChangeDashboard} />
              </div>
        )}
        {isCollapsed && (
          <div className="logoBlock mx-auto">
                <Image src="/logo.png" 
                height={40}
                width={40}
                alt="Logo"
                className="w-auto h-auto"
                unoptimized
                loading="eager"
                priority
                onClick={handleChangeDashboard} />
              </div>
        )}
        </div>
  );
};

export default LogoSection; // ✅ Ensure Default Export
