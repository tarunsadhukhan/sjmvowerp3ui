import LogoSection from "./LogoSection";
import { DynamicMenuConsole } from "./DynamicMenuConsole";
import { FixedMenuConsole } from "./FixedMenuConsole";
import { cn } from "@/lib/utils"
import { urlcheck } from "@/lib/auth";


interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function sidebarConsole({ isCollapsed, onToggle }: SidebarProps) {
  const {compshow } = urlcheck();

 
    return (
    <div className={cn(
        "bg-[#006699] text-white transition-all duration-300 h-screen flex flex-col",
        isCollapsed ? "w-20" : "w-56"
      )}>

    <div className={cn("bg-[#006699] text-white transition-all duration-300 h-screen flex flex-col", { 'collapsed-class': isCollapsed })}>
      <LogoSection isCollapsed={isCollapsed} onToggle={onToggle} logoSrc="path/to/logo.png" title="Your Title" />
        <DynamicMenuConsole isCollapsed={isCollapsed} />  
      <FixedMenuConsole isCollapsed={isCollapsed} /> 
    </div>
        </div>

  );
}
