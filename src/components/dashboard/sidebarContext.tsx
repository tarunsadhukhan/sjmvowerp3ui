import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface MenuItem {
  menu_id: number;
  menu_name: string;
  menu_path: string;
  menu_parent_id: number | null;
}

export interface Branch {
  branch_id: number;
  branch_name: string;
  menus: MenuItem[];
}

export interface Company {
  co_id: number;
  co_name: string;
  branches: Branch[];
}

interface SidebarContextType {
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  selectedCompany: Company | null;
  setSelectedCompany: React.Dispatch<React.SetStateAction<Company | null>>;
  selectedBranches: number[];
  setSelectedBranches: React.Dispatch<React.SetStateAction<number[]>>;
  expandedMenus: number[];
  setExpandedMenus: React.Dispatch<React.SetStateAction<number[]>>;
  availableMenus: MenuItem[];
  setAvailableMenus: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  parentMenus: MenuItem[];
  setParentMenus: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  handleCompanyChange: (companyId: number) => void;
  handleBranchChange: (branchIds: number[]) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  // State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<number[]>([]);
  const [availableMenus, setAvailableMenus] = useState<MenuItem[]>([]);
  const [parentMenus, setParentMenus] = useState<MenuItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCompanies = localStorage.getItem('sidebar_companies');
      if (storedCompanies) setCompanies(JSON.parse(storedCompanies));
      const storedCompany = localStorage.getItem('sidebar_selectedCompany');
      if (storedCompany) setSelectedCompany(JSON.parse(storedCompany));
      const storedBranches = localStorage.getItem('sidebar_selectedBranches');
      if (storedBranches) setSelectedBranches(JSON.parse(storedBranches));
      const storedMenus = localStorage.getItem('sidebar_expandedMenus');
      if (storedMenus) setExpandedMenus(JSON.parse(storedMenus));
      const storedMenuItems = localStorage.getItem('sidebar_menuItems');
      if (storedMenuItems) setMenuItems(JSON.parse(storedMenuItems));
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem('sidebar_companies', JSON.stringify(companies));
  }, [companies]);
  useEffect(() => {
    if (selectedCompany) {
      localStorage.setItem('sidebar_selectedCompany', JSON.stringify(selectedCompany));
    }
  }, [selectedCompany]);
  useEffect(() => {
    localStorage.setItem('sidebar_selectedBranches', JSON.stringify(selectedBranches));
  }, [selectedBranches]);
  useEffect(() => {
    localStorage.setItem('sidebar_expandedMenus', JSON.stringify(expandedMenus));
  }, [expandedMenus]);
  useEffect(() => {
    localStorage.setItem('sidebar_menuItems', JSON.stringify(menuItems));
  }, [menuItems]);

  // After companies are set (e.g., after API fetch), ensure selectedCompany is preserved if possible
  useEffect(() => {
    if (companies.length > 0) {
      setSelectedCompany(prev => {
        if (prev && companies.some(c => c.co_id === prev.co_id)) {
          return companies.find(c => c.co_id === prev.co_id) || companies[0];
        } else {
          setSelectedBranches(companies[0].branches.length > 0 ? [companies[0].branches[0].branch_id] : []);
          return companies[0];
        }
      });
    }
  }, [companies]);

  // Update availableMenus and parentMenus when company/branches change
  useEffect(() => {
    if (!selectedCompany || selectedBranches.length === 0) {
      setAvailableMenus([]);
      setParentMenus([]);
      return;
    }
    const allMenus: MenuItem[] = [];
    selectedCompany.branches
      .filter(branch => selectedBranches.includes(branch.branch_id))
      .forEach(branch => {
        branch.menus.forEach((menu: MenuItem) => {
          if (!allMenus.some(m => m.menu_id === menu.menu_id)) {
            allMenus.push(menu);
          }
        });
      });
    setAvailableMenus(allMenus);
    setParentMenus(allMenus.filter(menu => menu.menu_parent_id === null));
  }, [selectedCompany, selectedBranches]);

  // Handlers
  const handleCompanyChange = useCallback((companyId: number) => {
    const company = companies.find(c => c.co_id === companyId);
    if (company) {
      // only reload if the company actually changed
      const prevId = selectedCompany?.co_id;
      setSelectedCompany(company);
      const defaultBranches = company.branches.length > 0 ? [company.branches[0].branch_id] : [];
      setSelectedBranches(defaultBranches);
      if (prevId !== companyId) {
        // reload to refresh data for the newly selected company
        setTimeout(() => window.location.reload(), 50);
      }
    }
  }, [companies]);

  const handleBranchChange = useCallback((branchIds: number[]) => {
    // only reload when branches actually change
    const same = branchIds.length === selectedBranches.length && branchIds.every(id => selectedBranches.includes(id));
    setSelectedBranches(branchIds);
    if (!same) {
      setTimeout(() => window.location.reload(), 50);
    }
  }, []);

  return (
    <SidebarContext.Provider value={{
      companies, setCompanies,
      selectedCompany, setSelectedCompany,
      selectedBranches, setSelectedBranches,
      expandedMenus, setExpandedMenus,
      availableMenus, setAvailableMenus,
      parentMenus, setParentMenus,
      menuItems, setMenuItems,
      handleCompanyChange,
      handleBranchChange
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarContext = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebarContext must be used within SidebarProvider');
  return ctx;
};
