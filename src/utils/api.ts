const API_URL=process.env.NEXT_PUBLIC_API_BASE_URL || '/apix';
console.log('API_URL for all', API_URL);



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
    EDIT_ROLE_TENANT_MENU: `${API_URL}/companyAdmin/edit_role_tenant_admin`,
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
    EDIT_ROLE_CTRLDSK_MENU: `${API_URL}/ctrldskAdmin/edit_role_ctrldsk_admin`,
    ADMIN_CTRLDSK_MENU_BY_ROLEID: `${API_URL}/ctrldskAdmin/admin_ctrldsk_menu_by_roleid/`,

    
    GET_USER_CTRLDSK_ADMIN: `${API_URL}/ctrldskAdmin/get_user_ctrldsk_admin`,
    EDIT_USER_CTRLDSK_MENU: `${API_URL}/ctrldskAdmin/edit_user_ctrldsk_admin`,
    ROLES_DROPDOWN_CTRLDSK_ADMIN: `${API_URL}/ctrldskAdmin/get_roles_ctrldsk_admin_assign`,
    CREATE_USER_CTRLDESK_ADMIN: `${API_URL}/ctrldskAdmin/create_user_ctrldsk_admin`,

    EDIT_USER_CTRLDESK_MENU: `${API_URL}/ctrldskAdmin/edit_user_ctrldsk_admin`,
    
    GET_ORG_ALL: `${API_URL}/ctrldskAdmin/get_org_data_all`,
    GET_ORG_BY_ID: `${API_URL}/ctrldskAdmin/get_org_data_by_id/`,
    CREATE_ORG_SETUP: `${API_URL}/ctrldskAdmin/create_org_setup_data`,
    CREATE_ORG: `${API_URL}/ctrldskAdmin/create_org_data`,
    EDIT_ORG: `${API_URL}/ctrldskAdmin/edit_org_data`,



    GET_CO_ALL: `${API_URL}/companyAdmin/get_co_data_all`,
    GET_CO_BY_ID: `${API_URL}/companyAdmin/get_co_data_by_id/`,
    CREATE_CO_SETUP: `${API_URL}/companyAdmin/create_co_setup_data`,
    CREATE_CO: `${API_URL}/companyAdmin/create_co_data`,
    EDIT_CO: `${API_URL}/companyAdmin/edit_co_data`,

    CO_CONFIG: `${API_URL}/companyAdmin/co_config`,
    EDIT_CO_CONFIG: `${API_URL}/companyAdmin/company_config`,


    GET_PORTAL_ALLMENU_CTRLDSK_ADMIN_BY_ID: `${API_URL}/ctrldskAdmin/portal_allmenu_details_by_id`,
    GET_PORTAL_ALLMENU_CTRLDSK_ADMIN: `${API_URL}/ctrldskAdmin/portal_allmenu_details`,
    GET_PORTAL_MENU_CTRLDSK_ADMIN: `${API_URL}/ctrldskAdmin/portal_menu_details`,
    EDIT_PORTAL_MENU_CTRLDSK_MENU: `${API_URL}/ctrldskAdmin/edit_user_ctrldsk_admin`,
    GET_PORTAL_PARENT_MENU: `${API_URL}/ctrldskAdmin/portal_parentmenudetails`,
    GET_PORTAL_MODULE_NAME: `${API_URL}/ctrldskAdmin/portalmodulename`,
    GET_PORTAL_MENU_TYPE: `${API_URL}/ctrldskAdmin/portalmenutypedetails`,     
    GET_PORTAL_MENU_NAME: `${API_URL}/ctrldskAdmin/portalmenuname`,     
    PORTAL_MENU_CREATE: `${API_URL}/ctrldskAdmin/portalmenucreate`,     
    PORTAL_MENU_EDIT: `${API_URL}/ctrldskAdmin/portalmenuedit`,     
    ORG_MODULE_MAP: `${API_URL}/ctrldskAdmin/orgmodulemapdetails`,
    ADMIN_CTRLDSK_MODULE_BY_ORGID: `${API_URL}/ctrldskAdmin/admin_ctrldsk_module_by_orgid/`,
    ORGS_DROPDOWN_CTRLDSK_ADMIN: `${API_URL}/ctrldskAdmin/admin_ctrldsk_dropdown_org/`,
    EDIT_ORG_MODULE_MAP_CTRLDSK: `${API_URL}/ctrldskAdmin/edit_org_module_map_ctrldesk/`,


    GET_BRANCH_ALL: `${API_URL}/companyAdmin/get_branch_data_all`,
    GET_BRANCH_BY_ID: `${API_URL}/companyAdmin/get_branch_data_by_id/`,
    CREATE_BRANCH_SETUP: `${API_URL}/companyAdmin/create_branch_setup_data`,
    CREATE_BRANCH: `${API_URL}/companyAdmin/create_branch_data`,
    EDIT_BRANCH: `${API_URL}/companyAdmin/edit_branch_data`,

    GET_DEPARTMENT_ALL: `${API_URL}/companyAdmin/get_department_data_all`,
    CREATE_DEPARTMENT: `${API_URL}/companyAdmin/create_department_data`,
    EDIT_DEPARTMENT: `${API_URL}/companyAdmin/edit_department_data`,
    GET_DEPARTMENT_BY_ID: `${API_URL}/companyAdmin/get_department_data_by_id/`,
    GET_SUBDEPARTMENT_ALL: `${API_URL}/companyAdmin/get_subdepartment_data_all`,
};

const apiRoutesPortalMasters = {
    GET_ALL_ITEM_GRP: `${API_URL}/itemMaster/get_all_item_groups`,
    CREATE_ITEM_GRP_SETUP: `${API_URL}/itemMaster/createItemGroupSetup`,
    CREATE_ITEM_GRP: `${API_URL}/itemMaster/createItemGroup`,
    EDIT_ITEM_GRP: `${API_URL}/itemMaster/editItemGroup`,
    UPDATE_ITEM_GRP_ACTIVE: `${API_URL}/itemMaster/updateItemGroupActive`,
    ITEM_GROUP_DETAILS: `${API_URL}/itemMaster/itemGroupDetails`, // Added for details dialog
    GET_ITEM_TABLE: `${API_URL}/itemMaster/get_item_table`,
    ITEM_CREATE_SETUP: `${API_URL}/itemMaster/item_create_setup`,
    ITEM_CREATE: `${API_URL}/itemMaster/item_create`,
    ITEM_EDIT_SETUP: `${API_URL}/itemMaster/item_edit_setup`,
    ITEM_EDIT: `${API_URL}/itemMaster/item_edit`,
    ITEM_VIEW: `${API_URL}/itemMaster/item_view`,
    ITEM_MAKE_TABLE: `${API_URL}/itemMaster/item_make_table`,
    ITEM_MAKE_CREATE_SETUP: `${API_URL}/itemMaster/item_make_create_setup`,
    ITEM_MAKE_CREATE: `${API_URL}/itemMaster/item_make_create`,

    
    DEPT_MASTER_TABLE: `${API_URL}/deptMaster/dept_master_table`,
    DEPT_MASTER_VALIDATE_TABLE: `${API_URL}/deptMaster/dept_master_validate_table`,
    DEPT_MASTER_CREATE_SETUP: `${API_URL}/deptMaster/dept_master_create_setup`,
    DEPT_MASTER_CREATE: `${API_URL}/deptMaster/dept_master_create`,
    DEPT_MASTER_VIEW: `${API_URL}/deptMaster/dept_master_view`,

    SUBDEPT_MASTER_TABLE : `${API_URL}/deptMaster/subdept_master_table`,
    SUBDEPT_MASTER_CREATE_SETUP : `${API_URL}/deptMaster/subdept_master_create_setup`,
    SUBDEPT_MASTER_CREATE : `${API_URL}/deptMaster/subdept_master_create`,
    SUBDEPT_MASTER_VIEW : `${API_URL}/deptMaster/subdept_master_view`,

    MECHINE_TYPE_MASTER_TABLE : `${API_URL}/mechMaster/mechine_type_master_table`,
    MECHINE_TYPE_MASTER_CREATE_SETUP : `${API_URL}/mechMaster/mechine_type_master_create_setup`,
    MECHINE_TYPE_MASTER_CREATE : `${API_URL}/mechMaster/mechine_type_master_create`,
    MECHINE_TYPE_MASTER_VIEW : `${API_URL}/mechMaster/mechine_type_master_view`,

    MECHINE_MASTER_TABLE : `${API_URL}/mechMaster/mechine_master_table`,
    MECHINE_MASTER_CREATE_SETUP : `${API_URL}/mechMaster/mechine_master_create_setup`,
    MECHINE_MASTER_CREATE : `${API_URL}/mechMaster/mechine_master_create`,
    MECHINE_MASTER_EDIT_SETUP : `${API_URL}/mechMaster/mechine_master_edit_setup`,
    MECHINE_MASTER_EDIT : `${API_URL}/mechMaster/mechine_master_edit`,
    MECHINE_MASTER_VIEW : `${API_URL}/mechMaster/mechine_master_view`
    ,
    PROJECT_MASTER_TABLE: `${API_URL}/projectMaster/project_master_table`,
    PROJECT_MASTER_CREATE_SETUP: `${API_URL}/projectMaster/project_master_create_setup`,
    PROJECT_MASTER_CREATE: `${API_URL}/projectMaster/project_master_create`,
    PROJECT_MASTER_EDIT: `${API_URL}/projectMaster/project_master_edit`,
    PROJECT_MASTER_VIEW: `${API_URL}/projectMaster/project_master_view`,


    PARTY_TABLE: `${API_URL}/partyMaster/get_party_table`,
    PARTY_CREATE_SETUP: `${API_URL}/partyMaster/party_create_setup`,
    PARTY_CREATE: `${API_URL}/partyMaster/party_create`,
    PARTY_EDIT_SETUP: `${API_URL}/partyMaster/party_edit_setup`,
    PARTY_EDIT: `${API_URL}/partyMaster/party_edit`,

    WAREHOUSE_TABLE: `${API_URL}/warehouseMaster/get_warehouse_table`,
    WAREHOUSE_CREATE_SETUP: `${API_URL}/warehouseMaster/warehouse_create_setup`,
    WAREHOUSE_CREATE: `${API_URL}/warehouseMaster/warehouse_create`,
    WAREHOUSE_EDIT_SETUP: `${API_URL}/warehouseMaster/warehouse_edit_setup`,
    WAREHOUSE_EDIT: `${API_URL}/warehouseMaster/warehouse_edit`,

    COSTFACTOR_TABLE: `${API_URL}/costFactorMaster/get_cost_factor_table`,
    COSTFACTOR_CREATE_SETUP: `${API_URL}/costFactorMaster/cost_factor_create_setup`,
    COSTFACTOR_CREATE: `${API_URL}/costFactorMaster/cost_factor_create`,
    COSTFACTOR_EDIT_SETUP: `${API_URL}/costFactorMaster/cost_factor_edit_setup`,
    COSTFACTOR_EDIT: `${API_URL}/costFactorMaster/cost_factor_edit`,

    GET_INDENT_SETUP_1: `${API_URL}/procurementIndent/get_indent_setup_1`,
    GET_INDENT_SETUP_2: `${API_URL}/procurementIndent/get_indent_setup_2`,
    INDENT_TABLE: `${API_URL}/procurementIndent/get_indent_table`


};

export { apiRoutes, apiRoutesconsole, apiRoutesPortalMasters };

// NEXT_PUBLIC_API_BASE_URL=/api