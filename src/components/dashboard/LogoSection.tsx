import Image from "next/image";
import logo from "@/components/asstes/images/logo.png"
import { 
    ChevronLeft,
   
  } from "lucide-react"
  import { cn } from "@/lib/utils"
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
        <div className="logoBlock">
                <Image src={logo} alt="Logo" onClick={handleChangeDashboard} />
              </div>
         <button 
            onClick={onToggle}
            className="p-1 rounded-full hover:bg-[#005580] transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              size={20}
              className={cn(
                "transition-transform",
                isCollapsed && "transform rotate-180"
              )}
            />
          </button>
        </div>
  );
};

export default LogoSection; // ✅ Ensure Default Export
