const API_URL=process.env.NEXT_PUBLIC_API_BASE_URL || '/apix';



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
    PORTAL_MENU_PERMISSIONS: `${API_URL}/admin/PortalData/portal_menu_permissions`,
    PORTAL_MENU_PERMISSION_CHECK: `${API_URL}/admin/PortalData/portal_menu_permissions/check`,


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

    JUTE_QUALITY_TABLE: `${API_URL}/juteQualityMaster/get_jute_quality_table`,
    JUTE_QUALITY_BY_ID: `${API_URL}/juteQualityMaster/get_jute_quality_by_id`,
    JUTE_QUALITY_CREATE_SETUP: `${API_URL}/juteQualityMaster/jute_quality_create_setup`,
    JUTE_QUALITY_EDIT_SETUP: `${API_URL}/juteQualityMaster/jute_quality_edit_setup`,
    JUTE_QUALITY_CREATE: `${API_URL}/juteQualityMaster/jute_quality_create`,
    JUTE_QUALITY_EDIT: `${API_URL}/juteQualityMaster/jute_quality_edit`,

    // Jute Supplier Master endpoints (global - not company-specific)
    JUTE_SUPPLIER_TABLE: `${API_URL}/juteSupplierMaster/get_jute_supplier_table`,
    JUTE_SUPPLIER_BY_ID: `${API_URL}/juteSupplierMaster/get_jute_supplier_by_id`,
    JUTE_SUPPLIER_EDIT_SETUP: `${API_URL}/juteSupplierMaster/jute_supplier_edit_setup`,
    JUTE_SUPPLIER_CREATE: `${API_URL}/juteSupplierMaster/jute_supplier_create`,
    JUTE_SUPPLIER_EDIT: `${API_URL}/juteSupplierMaster/jute_supplier_edit`,

    // Jute Supplier Map endpoints (company-specific mappings)
    JUTE_SUPPLIER_MAP_TABLE: `${API_URL}/juteSupplierMap/get_jute_supplier_map_table`,
    JUTE_SUPPLIER_MAP_BY_ID: `${API_URL}/juteSupplierMap/get_jute_supplier_map_by_id`,
    JUTE_SUPPLIER_MAP_CREATE_SETUP: `${API_URL}/juteSupplierMap/jute_supplier_map_create_setup`,
    JUTE_SUPPLIER_MAP_AVAILABLE_PARTIES: `${API_URL}/juteSupplierMap/get_available_parties_for_supplier`,
    JUTE_SUPPLIER_MAP_CREATE: `${API_URL}/juteSupplierMap/jute_supplier_map_create`,
    JUTE_SUPPLIER_MAP_DELETE: `${API_URL}/juteSupplierMap/jute_supplier_map_delete`,

    // Jute Agent Map endpoints (agent branch to party branch mappings)
    JUTE_AGENT_MAP_TABLE: `${API_URL}/juteAgentMap/get_jute_agent_map_table`,
    JUTE_AGENT_MAP_BY_ID: `${API_URL}/juteAgentMap/get_jute_agent_map_by_id`,
    JUTE_AGENT_MAP_CREATE_SETUP: `${API_URL}/juteAgentMap/jute_agent_map_create_setup`,
    JUTE_AGENT_MAP_PARTY_BRANCHES: `${API_URL}/juteAgentMap/get_party_branches_for_agent`,
    JUTE_AGENT_MAP_CREATE: `${API_URL}/juteAgentMap/jute_agent_map_create`,
    JUTE_AGENT_MAP_DELETE: `${API_URL}/juteAgentMap/jute_agent_map_delete`,

    // Jute PO endpoints
    JUTE_PO_TABLE: `${API_URL}/jutePO/get_jute_po_table`,
    JUTE_PO_BY_ID: `${API_URL}/jutePO/get_jute_po_by_id`,
    JUTE_PO_LINE_ITEMS: `${API_URL}/jutePO/get_jute_po_line_items`,
    JUTE_PO_CREATE_SETUP: `${API_URL}/jutePO/jute_po_create_setup`,
    JUTE_PO_SUPPLIERS_BY_MUKAM: `${API_URL}/jutePO/get_suppliers_by_mukam`,
    JUTE_PO_PARTIES_BY_SUPPLIER: `${API_URL}/jutePO/get_parties_by_supplier`,
    JUTE_PO_QUALITIES_BY_ITEM: `${API_URL}/jutePO/get_qualities_by_item`,
    JUTE_PO_CREATE: `${API_URL}/jutePO/jute_po_create`,
    JUTE_PO_UPDATE: `${API_URL}/jutePO/jute_po_update`,
    JUTE_PO_OPEN: `${API_URL}/jutePO/open_jute_po`,
    JUTE_PO_APPROVE: `${API_URL}/jutePO/approve_jute_po`,
    JUTE_PO_REJECT: `${API_URL}/jutePO/reject_jute_po`,
    JUTE_PO_CANCEL_DRAFT: `${API_URL}/jutePO/cancel_draft_jute_po`,
    JUTE_PO_REOPEN: `${API_URL}/jutePO/reopen_jute_po`,

    // Jute Gate Entry endpoints
    JUTE_GATE_ENTRY_TABLE: `${API_URL}/juteGateEntry/get_jute_gate_entry_table`,
    JUTE_GATE_ENTRY_BY_ID: `${API_URL}/juteGateEntry/get_jute_gate_entry_by_id`,
    JUTE_GATE_ENTRY_CREATE_SETUP: `${API_URL}/juteGateEntry/jute_gate_entry_create_setup`,
    JUTE_GATE_ENTRY_CREATE: `${API_URL}/juteGateEntry/jute_gate_entry_create`,
    JUTE_GATE_ENTRY_UPDATE: `${API_URL}/juteGateEntry/jute_gate_entry_update`,
    JUTE_GATE_ENTRY_PARTIES_BY_SUPPLIER: `${API_URL}/juteGateEntry/get_parties_by_supplier`,
    JUTE_GATE_ENTRY_QUALITIES_BY_ITEM: `${API_URL}/juteGateEntry/get_qualities_by_item`,
    JUTE_GATE_ENTRY_PO_DETAILS: `${API_URL}/juteGateEntry/get_po_details`,

    // Jute Material Inspection endpoints
    JUTE_MATERIAL_INSPECTION_TABLE: `${API_URL}/juteMaterialInspection/get_inspection_table`,
    JUTE_MATERIAL_INSPECTION_BY_ID: `${API_URL}/juteMaterialInspection/get_inspection_by_id`,
    JUTE_MATERIAL_INSPECTION_SETUP: `${API_URL}/juteMaterialInspection/get_inspection_setup`,
    JUTE_MATERIAL_INSPECTION_QUALITIES: `${API_URL}/juteMaterialInspection/get_qualities_by_item`,
    JUTE_MATERIAL_INSPECTION_COMPLETE: `${API_URL}/juteMaterialInspection/complete_inspection`,
    JUTE_MATERIAL_INSPECTION_MR_LINE: `${API_URL}/juteMaterialInspection/get_mr_line_item`,
    JUTE_MATERIAL_INSPECTION_SAVE_MOISTURE: `${API_URL}/juteMaterialInspection/save_moisture_readings`,

    // Jute MR endpoints
    JUTE_MR_TABLE: `${API_URL}/juteMR/get_mr_table`,
    JUTE_MR_BY_ID: `${API_URL}/juteMR/get_mr_by_id`,
    JUTE_MR_UPDATE: `${API_URL}/juteMR/update_mr`,
    JUTE_MR_AGENT_OPTIONS: `${API_URL}/juteMR/get_agent_options`,
    JUTE_MR_WAREHOUSE_OPTIONS: `${API_URL}/juteMR/get_warehouse_options`,
    JUTE_MR_PARTY_BRANCHES: `${API_URL}/juteMR/get_party_branches`,
    JUTE_MATERIAL_INSPECTION_UPDATE_LINE: `${API_URL}/juteMaterialInspection/update_line_item`,

    // Jute Bill Pass endpoints
    JUTE_BILL_PASS_TABLE: `${API_URL}/juteBillPass/get_bill_pass_list`,
    JUTE_BILL_PASS_BY_ID: `${API_URL}/juteBillPass/get_bill_pass_by_id`,

    GET_INDENT_SETUP_1: `${API_URL}/procurementIndent/get_indent_setup_1`,
    GET_INDENT_SETUP_2: `${API_URL}/procurementIndent/get_indent_setup_2`,
    INDENT_CREATE: `${API_URL}/procurementIndent/create_indent`,
    INDENT_UPDATE: `${API_URL}/procurementIndent/update_indent`,
    INDENT_TABLE: `${API_URL}/procurementIndent/get_indent_table`,
    GET_INDENT_BY_ID: `${API_URL}/procurementIndent/get_indent_by_id`,
    GET_ALL_APPROVED_INDENTS: `${API_URL}/procurementIndent/get_all_approved_indents`,
    GET_APPROVAL_FLOW: `${API_URL}/procurementIndent/get_approval_flow`,
    INDENT_APPROVE: `${API_URL}/procurementIndent/approve_indent`,
    INDENT_APPROVE_WITH_VALUE: `${API_URL}/procurementIndent/approve_indent_with_value`,
    INDENT_OPEN: `${API_URL}/procurementIndent/open_indent`,
    INDENT_CANCEL_DRAFT: `${API_URL}/procurementIndent/cancel_draft_indent`,
    INDENT_REOPEN: `${API_URL}/procurementIndent/reopen_indent`,
    INDENT_SEND_FOR_APPROVAL: `${API_URL}/procurementIndent/send_indent_for_approval`,
    INDENT_REJECT: `${API_URL}/procurementIndent/reject_indent`,
    PO_TABLE: `${API_URL}/procurementPO/get_po_table`,
    GET_PO_SETUP_1: `${API_URL}/procurementPO/get_po_setup_1`,
    GET_PO_SETUP_2: `${API_URL}/procurementPO/get_po_setup_2`,
    GET_INDENT_LINE_ITEMS: `${API_URL}/procurementPO/get_indent_line_items`,
    GET_SUPPLIER_BRANCHES: `${API_URL}/procurementPO/get_supplier_branches`,
    PO_CREATE: `${API_URL}/procurementPO/create_po`,
    PO_SAVE: `${API_URL}/procurementPO/save_po`,
    PO_UPDATE: `${API_URL}/procurementPO/update_po`,
    GET_PO_BY_ID: `${API_URL}/procurementPO/get_po_by_id`,
    PO_APPROVE: `${API_URL}/procurementPO/approve_po`,
    PO_OPEN: `${API_URL}/procurementPO/open_po`,
    PO_CANCEL_DRAFT: `${API_URL}/procurementPO/cancel_draft_po`,
    PO_REOPEN: `${API_URL}/procurementPO/reopen_po`,
    PO_SEND_FOR_APPROVAL: `${API_URL}/procurementPO/send_po_for_approval`,
    PO_REJECT: `${API_URL}/procurementPO/reject_po`,
    PO_CLONE: `${API_URL}/procurementPO/clone_po`,

    INWARD_TABLE: `${API_URL}/procurementInward/get_inward_table`,
    GET_INWARD_SETUP_1: `${API_URL}/procurementInward/get_inward_setup_1`,
    GET_INWARD_SETUP_2: `${API_URL}/procurementInward/get_inward_setup_2`,
    GET_APPROVED_POS_BY_SUPPLIER: `${API_URL}/procurementInward/get_approved_pos_by_supplier`,
    GET_PO_LINE_ITEMS_FOR_INWARD: `${API_URL}/procurementInward/get_po_line_items`,
    INWARD_CREATE: `${API_URL}/procurementInward/create_inward`,
    INWARD_UPDATE: `${API_URL}/procurementInward/update_inward`,
    GET_INWARD_BY_ID: `${API_URL}/procurementInward/get_inward_by_id`,

    // Material Inspection endpoints
    INSPECTION_PENDING_LIST: `${API_URL}/materialInspection/get_pending_inspection_list`,
    INSPECTION_GET_BY_INWARD_ID: `${API_URL}/materialInspection/get_inspection_by_inward_id`,
    INSPECTION_COMPLETE: `${API_URL}/materialInspection/complete_inspection`,

    // Stores Receipt (SR) endpoints
    SR_PENDING_LIST: `${API_URL}/storesReceipt/get_sr_pending_list`,
    SR_GET_BY_INWARD_ID: `${API_URL}/storesReceipt/get_sr_by_inward_id`,
    SR_SETUP: `${API_URL}/storesReceipt/get_sr_setup`,
    SR_SAVE: `${API_URL}/storesReceipt/save_sr`,
    SR_OPEN: `${API_URL}/storesReceipt/open_sr`,
    SR_APPROVE: `${API_URL}/storesReceipt/approve_sr`,
    SR_REJECT: `${API_URL}/storesReceipt/reject_sr`,

    // DRCR Note endpoints
    DRCR_NOTE_LIST: `${API_URL}/drcrNote/get_drcr_note_list`,
    DRCR_NOTE_GET_BY_ID: `${API_URL}/drcrNote/get_drcr_note_by_id`,
    DRCR_NOTE_CREATE: `${API_URL}/drcrNote/create_drcr_note`,
    DRCR_NOTE_OPEN: `${API_URL}/drcrNote/open_drcr_note`,
    DRCR_NOTE_APPROVE: `${API_URL}/drcrNote/approve_drcr_note`,
    DRCR_NOTE_REJECT: `${API_URL}/drcrNote/reject_drcr_note`,
    DRCR_NOTE_GET_INWARD_FOR_CREATE: `${API_URL}/drcrNote/get_inward_for_drcr_note`,

    // Bill Pass endpoints
    BILL_PASS_LIST: `${API_URL}/billPass/get_bill_pass_list`,
    BILL_PASS_GET_BY_ID: `${API_URL}/billPass/get_bill_pass_by_id`,

    // Inventory Issue endpoints
    ISSUE_TABLE: `${API_URL}/inventoryIssue/get_issue_table`,
    ISSUE_GET_BY_ID: `${API_URL}/inventoryIssue/get_issue_by_id`,
    ISSUE_SETUP_1: `${API_URL}/inventoryIssue/get_issue_setup_1`,
    ISSUE_CREATE: `${API_URL}/inventoryIssue/create_issue`,
    ISSUE_UPDATE: `${API_URL}/inventoryIssue/update_issue`,
    ISSUE_UPDATE_STATUS: `${API_URL}/inventoryIssue/update_issue_status`,
    ISSUE_AVAILABLE_INVENTORY: `${API_URL}/inventoryIssue/get_available_inventory`,
    ISSUE_INVENTORY_LIST: `${API_URL}/inventoryIssue/get_inventory_list`,
    ISSUE_COST_FACTORS: `${API_URL}/inventoryIssue/get_cost_factors`,
    ISSUE_MACHINES: `${API_URL}/inventoryIssue/get_machines`,


};

export { apiRoutes, apiRoutesconsole, apiRoutesPortalMasters };

// NEXT_PUBLIC_API_BASE_URL=/api