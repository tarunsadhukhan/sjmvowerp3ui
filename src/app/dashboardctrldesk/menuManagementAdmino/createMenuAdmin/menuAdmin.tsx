import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { apiRoutesconsole } from "@/utils/api";

import { fetchWithCookie } from "@/utils/apiClient2";
import FormFieldWrapper from "@/components/ui/FormFieldWrapper";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface MenuAdminProps {
  menuId: number | null;
  menuName: string | null;
  parentId: number | null;
  parentName: string | null;
  active: number | null;
  moduleId: number | null;
  moduleName: string | null;
  menuPath: string | null;
  menuIcon: string | null;
  menuTypeId: number | null;
  menuTypeName: string | null;
  orderBy: number | null;
}

const MenuAdmin = ({
  menuId,
  menuName,
  parentId,
  parentName,
  active,
  moduleId,
  moduleName,
  menuPath,
  menuIcon,
  menuTypeId,
  menuTypeName,
  orderBy,
}: MenuAdminProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentOptions, setParentOptions] = useState<{ value: string; label: string }[]>([]);
  const [moduleOptions, setModuleOptions] = useState<{ value: string; label: string }[]>([]);
  const [menuTypeOptions, setMenuTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      menuName: menuName || "",
      parentId: parentId ? parentId.toString() : "",
      active: active === 1,
      moduleId: moduleId ? moduleId.toString() : "",
      menuPath: menuPath || "",
      menuTypeId: menuTypeId ? menuTypeId.toString() : "",
      orderBy: orderBy || 0,
      menuIcon: menuIcon || "", // Added menuIcon to defaultValues
    },
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const parentResponse = await fetchWithCookie(apiRoutesconsole.GET_PORTAL_PARENT_MENU, "GET");
        const moduleResponse = await fetchWithCookie(apiRoutesconsole.GET_PORTAL_MODULE_NAME, "GET");
        const menuTypeResponse = await fetchWithCookie(apiRoutesconsole.GET_PORTAL_MENU_TYPE, "GET"); // Updated property name

        if (parentResponse.error || moduleResponse.error || menuTypeResponse.error) {
          throw new Error(parentResponse.error || moduleResponse.error || menuTypeResponse.error || "Unknown error");
        }

        setParentOptions(
          parentResponse.data.map((item: any) => ({ value: item.menu_id.toString(), label: item.menu_name }))
        );
        setModuleOptions(
          moduleResponse.data.map((item: any) => ({ value: item.module_id.toString(), label: item.module_name }))
        );
        setMenuTypeOptions(
          menuTypeResponse.data.map((item: any) => ({ value: item.menu_type_id.toString(), label: item.menu_type }))
        );
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
        setError("Failed to fetch dropdown data. Please try again.");
      }
    };

    fetchDropdownData();

    if (menuIcon) {
      setIconPreview(menuIcon); // Assume menuIcon is already in HTML format
    }
  }, [menuIcon]);

  const validateIconFile = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    return validTypes.includes(file.type);
  };

  const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateIconFile(file)) {
      const reader = new FileReader();
      reader.onload = () => {
        setIconPreview(reader.result as string); // Save as HTML format
        form.setValue("menuIcon", reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Invalid file type. Please upload a JPG, JPEG, or PNG file.");
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);

    // Validation for required fields
    if (!data.menuName) {
      setError("Menu Name is required.");
      setLoading(false);
      return;
    }
    if (!data.parentId) {
      setError("Parent Name is required.");
      setLoading(false);
      return;
    }
    if (!data.moduleId) {
      setError("Module Name is required.");
      setLoading(false);
      return;
    }
    if (!data.menuTypeId) {
      setError("Menu Type is required.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        menuId,
        menuName: data.menuName,
        parentId: data.parentId ? parseInt(data.parentId) : null,
        active: data.active ? 1 : 0,
        moduleId: data.moduleId ? parseInt(data.moduleId) : null,
        menuPath: data.menuPath,
        menuIcon: data.menuIcon, // Save as HTML format
        menuTypeId: data.menuTypeId ? parseInt(data.menuTypeId) : null,
        orderBy: data.orderBy,
      };

      const apiUrl = menuId
        ? `${apiRoutesconsole.EDIT_PORTAL_MENU_CTRLDSK_MENU}/${menuId}`
        : apiRoutesconsole.CREATE_ROLE_CTRLDSK_ADMIN;

      const method = menuId ? "PUT" : "POST";

      const response = await fetchWithCookie(apiUrl, method, payload);
      if (response.error) {
        throw new Error(response.error);
      }

      router.push("/dashboardctrldesk/menuManagementAdmin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto mt-10">
      <h2 className="text-lg font-semibold mb-4">
        {menuId ? "Edit Menu" : "Create Menu"}
      </h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <FormFieldWrapper
              name="menuName"
              control={form.control}
              label="Menu Name"
              placeholder="Enter Menu Name"
              type="text"
              required
            />
            {form.formState.errors.menuName && (
              <p className="text-red-500 mt-1">{form.formState.errors.menuName?.message}</p>
            )}
          </div>

          <div>
            <FormFieldWrapper
              name="parentId"
              control={form.control}
              label="Parent Name"
              type="select"
              options={parentOptions}
              required
            />
            {form.formState.errors.parentId && (
              <p className="text-red-500 mt-1">{form.formState.errors.parentId?.message}</p>
            )}
          </div>

          <div>
            <FormFieldWrapper
              name="moduleId"
              control={form.control}
              label="Module Name"
              type="select"
              options={moduleOptions}
              required
            />
            {form.formState.errors.moduleId && (
              <p className="text-red-500 mt-1">{form.formState.errors.moduleId?.message}</p>
            )}
          </div>

          <div>
            <FormFieldWrapper
              name="menuTypeId"
              control={form.control}
              label="Menu Type"
              type="select"
              options={menuTypeOptions}
              required
            />
            {form.formState.errors.menuTypeId && (
              <p className="text-red-500 mt-1">{form.formState.errors.menuTypeId?.message}</p>
            )}
          </div>

          <div>
            <FormFieldWrapper
              name="menuPath"
              control={form.control}
              label="Menu Path"
              placeholder="Enter Menu Path"
            />
            {form.formState.errors.menuPath && (
              <p className="text-red-500 mt-1">{form.formState.errors.menuPath?.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="menuIcon" className="block text-sm font-medium text-gray-700">
              Menu Icon
            </label>
            <input
              type="file"
              id="menuIcon"
              accept=".jpg,.jpeg,.png"
              onChange={handleIconChange}
            />
            {iconPreview && <img src={iconPreview} alt="Icon Preview" className="mt-2 h-16 w-16" />}
          </div>

          <div>
            <FormFieldWrapper
              name="orderBy"
              control={form.control}
              label="Order By"
              type="number"
              placeholder="Enter Order"
            />
            {form.formState.errors.orderBy && (
              <p className="text-red-500 mt-1">{form.formState.errors.orderBy?.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={form.getValues("active")}
              onCheckedChange={(checked) => form.setValue("active", checked === true)}
            />
            <Label htmlFor="active">Active</Label>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboardctrldesk/menuManagementAdmin")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#9BC837] hover:bg-[#8BB72E] text-white"
              disabled={loading}
            >
              {loading ? "Processing..." : menuId ? "Update Menu" : "Create Menu"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};

export default MenuAdmin;



