'use client';
import LogoSection from "./LogoSection";
import { CompanySelection } from "./CompanySelection";
import { DynamicMenu } from "./DynamicMenu";
import { DynamicMenuConsole } from "./DynamicMenuConsole";
import { FixedMenu } from "./FixedMenu";
// import { cn } from "@/utils/protected"
import { urlcheck } from "@/utils/auth";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const {compshow } = urlcheck();

 
    return (
    <div className={`bg-[#006699] text-white transition-all duration-300 h-screen flex flex-col ${isCollapsed ? "w-20" : "w-56"}`}>

    <div className={`bg-[#006699] text-white transition-all duration-300 h-screen flex flex-col ${isCollapsed ? 'collapsed-class' : ''}`}>
      <LogoSection isCollapsed={isCollapsed} onToggle={onToggle} logoSrc="path/to/logo.png" title="Your Title" />
       {compshow === 2 && <CompanySelection isCollapsed={isCollapsed} />}
       { compshow===1 &&  <DynamicMenuConsole isCollapsed={isCollapsed} />}  
       { compshow===2 &&  <DynamicMenu isCollapsed={isCollapsed} />}  
      <FixedMenu isCollapsed={isCollapsed} /> 
    </div>
        </div>

  );
}
