"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, SubMenu, UserRoleMapping, PERMISSION_VALUES } from "@/types";
import axios from "axios";
import apiRoutes from "@/utils/api";

export default function CreateRole() {
  const router = useRouter();
  const [roleData, setRoleData] = useState({
    type: "",
    name: "",
  });

  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<number, number>>({});
  const [expandedMenus, setExpandedMenus] = useState<Record<number, boolean>>({});
  const [enabledMenus, setEnabledMenus] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (roleData.type) {
      fetchMenus(roleData.type);
    }
  }, [roleData.type]);

  const fetchMenus = async (type: string) => {
    try {
      setLoading(true);
     // const response = await axios.get(`/menus?type=${type}`);
     // setMenus(response.data.data || []);
      const  response = await axios.get(`${apiRoutes.ROLES_MENU_CONSOLE}?type=${type}`);
      //setMenus(data);
      setMenus(response.data.data || []); // Ensure menus is set to an empty array if data is undefined

      


      // Initialize expanded and enabled states for new menus
      const newExpandedState: Record<number, boolean> = {};
      const newEnabledState: Record<number, boolean> = {};
      response.data.data.forEach((menu: Menu) => {
        newExpandedState[menu.id] = true;
        newEnabledState[menu.id] = true;
      });
      setExpandedMenus(newExpandedState);
      setEnabledMenus(newEnabledState);
    } catch (error) {
      console.error('Error fetching menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMenuExpansion = (menuId: number) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const toggleMenuEnabled = (menuId: number) => {
    setEnabledMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));

    // Clear permissions for disabled menu's submenus
    if (enabledMenus[menuId]) {
      const menuToDisable = menus.find(m => m.id === menuId);
      if (menuToDisable) {
        const newPermissions = { ...selectedPermissions };
        menuToDisable.subMenus.forEach(subMenu => {
          delete newPermissions[subMenu.id];
        });
        setSelectedPermissions(newPermissions);
      }
    }
  };

  const handlePermissionChange = (menuId: number, value: number) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [menuId]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // First create the role
      const { data: role } = await axios.post('/roles', roleData);

      // Filter permissions to only include enabled menus
      const filteredPermissions = Object.entries(selectedPermissions).reduce((acc, [subMenuId, permission]) => {
        const menu = menus.find(m => m.subMenus.some(sm => sm.id === parseInt(subMenuId)));
        if (menu && enabledMenus[menu.id]) {
          acc[subMenuId] = permission;
        }
        return acc;
      }, {} as Record<string, number>);

      // Then create the user role mapping
      const mapping: UserRoleMapping = {
        user_id: 1, // Replace with actual user ID
        role_id: role.id,
        co_id: 1, // Replace with actual company ID
        branch_id: 1, // Replace with actual branch ID
        created_by_con_user: 1, // Replace with actual user ID
        created_at: new Date().toISOString()
      };

      await axios.post('/user-role-mappings', {
        mapping,
        permissions: filteredPermissions
      });

      router.push('/');
    } catch (error) {
      console.error('Error creating role:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0C3C60]">Role Creation</h1>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-[#E6F3F9] border-none">
              Billing Details
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-gray-200"
            >
              <UserCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Role Type</Label>
                <Select
                  value={roleData.type}
                  onValueChange={(value) => setRoleData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Portal">Portal</SelectItem>
                    <SelectItem value="App">App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role Name <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="Enter Role Name..."
                  value={roleData.name}
                  onChange={(e) => setRoleData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>

            {roleData.type && (
              <div className="mt-8">
                <div className="bg-[#3687c5] text-white p-4 grid grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-4 rounded-lg">
                  <div>Modules</div>
                  <div className="text-center">Enable</div>
                  <div className="text-center">Read</div>
                  <div className="text-center">Write</div>
                  <div className="text-center">Modify</div>
                </div>

                {menus.map(menu => (
                  <div key={menu.id} className="border-b">
                    <div className="py-3 px-4 bg-gray-50 font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleMenuExpansion(menu.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {expandedMenus[menu.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        {menu.name}
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={enabledMenus[menu.id]}
                          onChange={() => toggleMenuEnabled(menu.id)}
                          className="h-4 w-4"
                        />
                      </div>
                    </div>
                    {expandedMenus[menu.id] && enabledMenus[menu.id] && menu.subMenus.map(subMenu => (
                      <div key={subMenu.id} className="py-2 px-4 grid grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-4 items-center">
                        <div className="pl-8">{subMenu.name}</div>
                        <div className="text-center">
                          {/* Empty cell for alignment */}
                        </div>
                        <div className="text-center">
                          <input
                            type="radio"
                            name={`permission-${subMenu.id}`}
                            checked={selectedPermissions[subMenu.id] === PERMISSION_VALUES.read}
                            onChange={() => handlePermissionChange(subMenu.id, PERMISSION_VALUES.read)}
                            className="h-4 w-4"
                          />
                        </div>
                        <div className="text-center">
                          <input
                            type="radio"
                            name={`permission-${subMenu.id}`}
                            checked={selectedPermissions[subMenu.id] === PERMISSION_VALUES.write}
                            onChange={() => handlePermissionChange(subMenu.id, PERMISSION_VALUES.write)}
                            className="h-4 w-4"
                          />
                        </div>
                        <div className="text-center">
                          <input
                            type="radio"
                            name={`permission-${subMenu.id}`}
                            checked={selectedPermissions[subMenu.id] === PERMISSION_VALUES.modify}
                            onChange={() => handlePermissionChange(subMenu.id, PERMISSION_VALUES.modify)}
                            className="h-4 w-4"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
              >
                Cancel
              </Button>
              <Button 
                className="bg-[#95C11F] hover:bg-[#85ad1b] text-white"
                onClick={handleSubmit}
                disabled={!roleData.name || !roleData.type || loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        <p className="text-red-500 mt-6 text-center">
          **** This menu is used to create and manage role for the user.... ****
        </p>
      </div>
    </div>
  );
}