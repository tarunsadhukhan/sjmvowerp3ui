import Link from "next/link";
import { ChevronDown } from "lucide-react";
//import { cn } from "@/lib/utils";
import { useCompanyConsole } from "@/hooks/use-org-ctrldesk";
import {  useState } from "react"

interface MenuItem {
  title: string;
  path?: string;
  icon: React.ReactNode;
  submenu?: MenuItem[];
}

export function DynamicMenuConsole({ isCollapsed }: { isCollapsed: boolean }) {
  const { menuItems } = useCompanyConsole();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [pageTitle, setPageTitle] = useState("Dashboard");
  console.log(menuItems)


  const toggleSubmenu = (title: string) => {
    setOpenMenus(prev =>
      prev.includes(title) ? prev.filter(item => item !== title) : [...prev, title]
    );
  };

  const renderMenuItem = (item: MenuItem) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isOpen = openMenus.includes(item.title);

    return (
      <div key={item.title}>
        <Link
          href={item.path || "#"}
          className="flex items-center px-4 py-2 text-sm text-white hover:bg-[#005580] transition-colors"
          onClick={(e) => {
            if (hasSubmenu) {
              e.preventDefault();
              toggleSubmenu(item.title);
              console.log('itttsts',item.title)
            } 
          }}
        >
          <span className="mr-3">{item.icon}</span>
          {!isCollapsed && (
            <>
              <span className="flex-1">{item.title}</span>
              {hasSubmenu && <ChevronDown size={16} className={isOpen ? "rotate-180" : ""} />}
            </>
          )}
        </Link>
        {hasSubmenu && isOpen && !isCollapsed && (
          <div className="ml-4 border-l border-[#005580]">
            {item.submenu?.map(subItem => renderMenuItem(subItem))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="flex-1 overflow-y-auto mt-4">
      {menuItems.map(item => renderMenuItem(item))}
    </nav>
  );
}
