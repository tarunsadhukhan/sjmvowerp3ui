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
    ADMIN_TENANT_MENU_BY_ROLEID: `${API_URL}/companyAdmin/admin_tenant_menu_by_roleid/`,
};

export default apiRoutes;

// NEXT_PUBLIC_API_BASE_URL=/api