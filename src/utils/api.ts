const API_URL=process.env.NEXT_PUBLIC_API_BASE_URL || '/apix';
console.log('API_URL for all', API_URL);

// const isProxyEnabled = process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("/");
// const isProxyEnabled = process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("/");


// const API_URL = (relativePath: string) => {
//   if (isProxyEnabled) {
//     return `/api/${relativePath}`;
//   } else {
//     return `${process.env.NEXT_PUBLIC_API_BASE_URL}${relativePath}`;
//   }
// };

// const API_URL = (relativePath: string) => {
//     if (isProxyEnabled) {
//       return `/api${relativePath}`;
//     } else {
//       return `${process.env.NEXT_PUBLIC_API_BASE_URL}${relativePath}`;
//     }
//   };

// const isProxyEnabled = process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("/");
// const isProxyEnabled = process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("/");


// const API_URL = (relativePath: string) => {
//   if (isProxyEnabled) {
//     return `/api/${relativePath}`;
//   } else {
//     return `${process.env.NEXT_PUBLIC_API_BASE_URL}${relativePath}`;
//   }
// };

// const API_URL = (relativePath: string) => {
//     if (isProxyEnabled) {
//       return `/api${relativePath}`;
//     } else {
//       return `${process.env.NEXT_PUBLIC_API_BASE_URL}${relativePath}`;
//     }
//   };

// const isProxyEnabled = process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("/");
// const isProxyEnabled = process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("/");


// const API_URL = (relativePath: string) => {
//   if (isProxyEnabled) {
//     return `/api/${relativePath}`;
//   } else {
//     return `${process.env.NEXT_PUBLIC_API_BASE_URL}${relativePath}`;
//   }
// };

// const API_URL = (relativePath: string) => {
//     if (isProxyEnabled) {
//       return `/api${relativePath}`;
//     } else {
//       return `${process.env.NEXT_PUBLIC_API_BASE_URL}${relativePath}`;
//     }
//   };

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
    PORTAL_USER_EDIT_BY_USERID: `${API_URL}/admin/PortalData/get_user_edit_setup_data/`,
    PORTAL_CO_BRANCH_SUBMENU: `${API_URL}/admin/PortalData/co_branch_submenu`,
    PORTAL_APPROVAL_LEVELS_DATA: `${API_URL}/admin/PortalData/approval_level_data_setup`,
    PORTAL_APPROVAL_LEVELS_DATA_SUBMIT: `${API_URL}/admin/PortalData/approval_level_data_setup_submit`,
    PORTAL_MENU_ITEMS: `${API_URL}/admin/PortalData/portal_menu_items`,


    ROLES_CONSOLE_CONSOLE: `${API_URL}/consoleAdmin/roles_console_admin`,
};
const apiRoutesconsole = {
    //ctrl desk and console
    ROLES_CTRLDSK: `${API_URL}/ctrldskAdmin/roles_ctrldsk_admin`,
    CREATE_ROLE_CONSOLE_ADMIN: `${API_URL}/consoleAdmin/create_role_console_admin`,
    CTRLDSK_ALL_MENUS: `${API_URL}/ctrldskAdmin/admin_ctrldsk_menu_full`,
    CREATE_ROLE_CTRLDSK_ADMIN: `${API_URL}/ctrldskAdmin/create_role_ctrldsk_admin`,
    EDIT_ROLE_CTRLDSK_MENU: `${API_URL}/ctrldskAdmin/edit_role_ctrldsk_admin/`,
    ADMIN_CTRLDSK_MENU_BY_ROLEID: `${API_URL}/ctrldskAdmin/admin_ctrldsk_menu_by_roleid/`,

    
    GET_USER_CTRLDSK_ADMIN: `${API_URL}/ctrldskAdmin/get_user_ctrldsk_admin`,
    EDIT_USER_CTRLDSK_MENU: `${API_URL}/ctrldskAdmin/edit_user_ctrldsk_admin/`,
    ROLES_DROPDOWN_CTRLDSK_ADMIN: `${API_URL}/ctrldskAdmin/get_roles_ctrldsk_admin_assign`,
    CREATE_USER_CTRLDESK_ADMIN: `${API_URL}/ctrldskAdmin/create_user_ctrldsk_admin`,
    EDIT_USER_CTRLDESK_MENU: `${API_URL}/ctrldskAdmin/edit_user_ctrldsk_admin/`


};

export { apiRoutes, apiRoutesconsole };

// NEXT_PUBLIC_API_BASE_URL=/api