'use client';
import LogoSection from "./LogoSection";
import { DynamicMenuCompanyConsole } from "./DynamicMenuCompanyConsole";
import { FixedMenuConsole } from "./FixedMenuConsole";
// import { cn } from "@/utils/protected"



interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function sidebarConsole({ isCollapsed, onToggle }: SidebarProps) {
  
 
    return (
    <div className={`bg-[#006699] text-white transition-all duration-300 h-screen flex flex-col ${isCollapsed ? "w-20" : "w-56"}`}>

    <div className={`bg-[#006699] text-white transition-all duration-300 h-screen flex flex-col ${isCollapsed ? 'collapsed-class' : ''}`}>
      <LogoSection isCollapsed={isCollapsed} onToggle={onToggle} logoSrc="path/to/logo.png" title="Your Title" />
        <DynamicMenuCompanyConsole isCollapsed={isCollapsed} />  
      <FixedMenuConsole isCollapsed={isCollapsed} /> 
    </div>
        </div>

  );
}
