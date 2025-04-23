const API_URL=process.env.NEXT_PUBLIC_API_BASE_URL || '/apix';
console.log('API_URL', API_URL);

const apiRoutes ={
    //ctrl desk and console
    MENU_CTRLDESK : `${API_URL}/companyRoutes/console_menu_items`,
    SUPERADMINLOGINCONSOLE : `${API_URL}/authRoutes/loginconsole`,
    USERLOGINCONSOLE : `${API_URL}/authRoutes/login`,
    PROTECTED : `${API_URL}/authRoutes/protected`,
    VERIFYSESSION : `${API_URL}/authRoutes/verify-session`,
    MENU_CONSOLE: `${API_URL}/companyAdmin/company_console_menu_items`,
    ROLES_CONSOLE: `${API_URL}/companyRoutes/roles`,
    ROLES_COMP_CONSOLE: `${API_URL}/companyAdmin/roles_tenant_admin`,
    GETMENUMAPPINGCOMPANY: `${API_URL}/companyAdmin/menu-mapping-data`,
    CREATEROLE: `${API_URL}/companyRoutes/create-role`,
    TENANT_ALL_MENUS: `${API_URL}/companyAdmin/admin_tenant_menu_full`,
    GET_TENANT_ADMIN_MENU_ROLE: `${API_URL}/companyAdmin/tenant_console_menu_items_roleid`,
    ADMIN_TENANT_MENU_BY_ROLEID: `${API_URL}/companyAdmin/admin_tenant_menu_by_roleid/`,
    CREATE_ROLE_TENANT_ADMIN: `${API_URL}/companyAdmin/create_role_tenant_admin`,
    EDIT_ROLE_TENANT_MENU: `${API_URL}/companyAdmin/edit_role_tenant_admin/`,
    GET_USER_TENANT_ADMIN: `${API_URL}/companyAdmin/get_user_tenant_admin`,
    CREATE_USER_TENANT_ADMIN: `${API_URL}/companyAdmin/create_user_tenant_admin`,
    EDIT_USER_TENANT_MENU: `${API_URL}/companyAdmin/edit_user_tenant_admin/`,
    ROLES_DROPDOWN_TENANT_ADMIN: `${API_URL}/companyAdmin/get_roles_tenant_admin_assign`,
    ROLES_PORTAL: `${API_URL}/admin/PortalData/get_roles_portal`,
    USERS_PORTAL: `${API_URL}/admin/PortalData/get_users_portal`,
    PORTAL_MENU_FULL: `${API_URL}/admin/PortalData/portal_menu_full`,
    GET_PORTAL_MENU_BY_ROLEID: `${API_URL}/admin/PortalData/portal_menu_by_roleid/`,
    CREATE_PORTAL_ROLE: `${API_URL}/admin/PortalData/create_role_portal`,
    EDIT_PORTAL_ROLE: `${API_URL}/admin/PortalData/edit_role_portal/`,
    PORTAL_USER_CREATE_FULL: `${API_URL}/admin/PortalData/get_user_create_setup_data`,
    CREATE_PORTAL_USER: `${API_URL}/admin/PortalData/create_user_portal`,
    EDIT_PORTAL_USER: `${API_URL}/admin/PortalData/edit_user_portal/`,
    
};

export default apiRoutes;

// NEXT_PUBLIC_API_BASE_URL=/api