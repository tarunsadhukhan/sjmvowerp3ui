'use client';
import { useEffect, useState } from 'react';
import LogoSection from "./LogoSection";
import { FixedMenu } from "./FixedMenu";
import { urlcheck } from "@/utils/auth";
import { fetchWithCookie } from "@/utils/apiClient2";

import { apiRoutes } from "@/utils/api";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MenuItem {
  menu_id: number;
  menu_name: string;
  menu_path: string;
  menu_parent_id: number | null;
}

interface Branch {
  branch_id: number;
  branch_name: string;
  menus: MenuItem[];
}

interface Company {
  co_id: number;
  co_name: string;
  branches: Branch[];
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { compshow } = urlcheck();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [availableMenus, setAvailableMenus] = useState<MenuItem[]>([]);
  const [parentMenus, setParentMenus] = useState<MenuItem[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<number[]>([]);
  // useState declarations for loading and error states, initialized with consistent values
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Add a state to track client-side rendering
  const [isClient, setIsClient] = useState(false);

  // Mark when client-side rendering has occurred
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch companies and menu data
  useEffect(() => {
    // Only fetch data when compshow === 2 (portal view) and we're client-side
    if (!isClient || compshow !== 2) return;
    
    const fetchCompanyData = async () => {
      setIsLoading(true);
      try {
        const result = await fetchWithCookie(apiRoutes.PORTAL_MENU_ITEMS, "GET");
        
        if (result.data && !result.error) {
          console.log("Company and menu data fetched:", result.data);
          setCompanies(result.data);
          
          // Select the first company by default
          if (result.data.length > 0) {
            setSelectedCompany(result.data[0]);
            // Auto-select first branch for convenience
            if (result.data[0].branches.length > 0) {
              setSelectedBranches([result.data[0].branches[0].branch_id]);
            }
          }
        } else {
          console.error("Failed to fetch company and menu data:", result.error);
          setError("Failed to load company data");
        }
      } catch (error) {
        console.error("Error fetching company and menu data:", error);
        setError("Error loading company data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [compshow, isClient]);

  // Process menus based on selected company and branches
  useEffect(() => {
    if (!selectedCompany || selectedBranches.length === 0) {
      setAvailableMenus([]);
      setParentMenus([]);
      return;
    }

    // Get all menus from selected branches
    const allMenus: MenuItem[] = [];
    selectedCompany.branches
      .filter(branch => selectedBranches.includes(branch.branch_id))
      .forEach(branch => {
        branch.menus.forEach((menu: MenuItem) => {
          // Check if menu is already added to avoid duplicates
          if (!allMenus.some(m => m.menu_id === menu.menu_id)) {
            allMenus.push(menu);
          }
        });
      });

    setAvailableMenus(allMenus);
    
    // Separate parent menus for top-level rendering
    const parents = allMenus.filter(menu => menu.menu_parent_id === null);
    setParentMenus(parents);
  }, [selectedCompany, selectedBranches]);

  // Handle company selection change
  const handleCompanyChange = (companyId: string) => {
    const company = companies.find(c => c.co_id.toString() === companyId);
    if (company) {
      setSelectedCompany(company);
      setSelectedBranches([]); // Reset branch selection
    }
  };

  // Toggle branch selection
  const handleBranchChange = (branchId: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedBranches(prev => [...prev, branchId]);
    } else {
      setSelectedBranches(prev => prev.filter(id => id !== branchId));
    }
  };

  // Toggle menu expansion
  const toggleMenu = (menuId: number) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId) 
        : [...prev, menuId]
    );
  };

  // Get child menus for a parent menu
  const getChildMenus = (parentId: number): MenuItem[] => {
    return availableMenus.filter(menu => menu.menu_parent_id === parentId);
  };

  // Render a menu item
  const renderMenuItem = (menu: MenuItem, level = 0) => {
    const isParent = availableMenus.some(m => m.menu_parent_id === menu.menu_id);
    const isExpanded = expandedMenus.includes(menu.menu_id);
    const childMenus = getChildMenus(menu.menu_id);
    
    return (
      <div key={menu.menu_id} className="menu-item">
        <div 
          className={`flex items-center py-2 px-2 hover:bg-[#00557a] rounded-md transition-colors ${level > 0 ? 'ml-6' : ''}`}
          style={{ paddingLeft: `${level * 8}px` }}
        >
          {isParent && (
            <div 
              className="flex items-center cursor-pointer mr-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => toggleMenu(menu.menu_id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="h-4 w-4 transition-transform duration-200" />
              )}
            </div>
          )}
          
          <a 
            href={`/dashboard/${menu.menu_path}`}
            className="text-sm flex-1 text-white hover:text-gray-200"
          >
            {menu.menu_name}
          </a>
        </div>
        
        {isParent && isExpanded && (
          <div className="overflow-hidden transition-all duration-300 ease-in-out">
            {childMenus.map(childMenu => renderMenuItem(childMenu, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Branch selection dialog
  const BranchSelectionDialog = () => (
    <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">Select Branches</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {selectedCompany?.branches.map(branch => (
            <div key={branch.branch_id} className="flex items-center space-x-2">
              <Checkbox 
                id={`branch-${branch.branch_id}`}
                checked={selectedBranches.includes(branch.branch_id)}
                onCheckedChange={(checked) => 
                  handleBranchChange(branch.branch_id, checked === true)
                }
              />
              <label
                htmlFor={`branch-${branch.branch_id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {branch.branch_name}
              </label>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={() => setBranchDialogOpen(false)}
            className="bg-[#006699] hover:bg-[#00557a]"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className={`bg-[#006699] text-white transition-all duration-300 h-screen flex flex-col ${isCollapsed ? "w-20" : "w-56"}`}>
      <div className={`bg-[#006699] text-white transition-all duration-300 h-screen flex flex-col ${isCollapsed ? 'collapsed-class' : ''}`}>
        <LogoSection isCollapsed={isCollapsed} onToggle={onToggle} logoSrc="path/to/logo.png" title="Your Title" />
        
        {/* Consistent structure for all cases to prevent hydration errors */}
        <div className="px-4 py-3 border-b border-[#005580]">
          {isClient && compshow === 2 && !isCollapsed ? (
            <>
              {/* Company Selection */}
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">Company</label>
                <Select 
                  value={selectedCompany?.co_id.toString() || ""}
                  onValueChange={handleCompanyChange}
                >
                  <SelectTrigger className="bg-[#005580] border-none text-white">
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {companies.map(company => (
                      <SelectItem key={company.co_id} value={company.co_id.toString()}>
                        {company.co_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Branch Selection Button */}
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">Branches</label>
                <button
                  onClick={() => setBranchDialogOpen(true)}
                  className="w-full p-2 bg-[#005580] rounded flex justify-between items-center text-sm"
                  disabled={!selectedCompany}
                >
                  <span>
                    {selectedBranches.length === 0 
                      ? "Select Branches" 
                      : `${selectedBranches.length} branch${selectedBranches.length !== 1 ? 'es' : ''} selected`}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="mb-2">
              {isClient && compshow === 1 && (
                <p className="text-sm">Console View</p>
              )}
              {(!isClient || isCollapsed) && (
                <p className="text-sm">&#8203;</p> 
              )}
            </div>
          )}
        </div>
        
        {/* Branch Selection Dialog */}
        {isClient && selectedCompany !== null && <BranchSelectionDialog />}
        
        {/* Menu Content Area - Consistent structure */}
        <div className="flex-1 overflow-auto pt-2">
          {isClient && compshow === 2 ? (
            <>
              {isLoading ? (
                <div className="px-4 py-2 text-center">
                  <span className="text-sm">Loading menu...</span>
                </div>
              ) : error ? (
                <div className="px-4 py-2 text-center">
                  <span className="text-sm text-red-300">{error}</span>
                </div>
              ) : (
                <>
                  {parentMenus.length > 0 ? (
                    <div className="px-2">
                      {parentMenus.map(menu => renderMenuItem(menu))}
                    </div>
                  ) : selectedBranches.length === 0 ? (
                    <div className="px-4 py-2 text-center">
                      <span className="text-sm">Please select at least one branch</span>
                    </div>
                  ) : (
                    <div className="px-4 py-2 text-center">
                      <span className="text-sm">No menus available</span>
                    </div>
                  )}
                </>
              )}
            </>
          ) : null}
        </div>
        
        <FixedMenu isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}
