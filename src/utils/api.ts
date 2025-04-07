
const API_URL=process.env.NEXT_PUBLIC_API_BASE_URL || '/apix';
console.log('API_URL', API_URL);

const apiRoutes ={
    MENU_CTRLDESK : `${API_URL}/companyRoutes/console_menu_items`,
    SUPERADMINLOGINCONSOLE : `${API_URL}/authRoutes/loginconsole`,
    USERLOGINCONSOLE : `${API_URL}/authRoutes/login`,
    PROTECTED : `${API_URL}/authRoutes/protected`,
    VERIFYSESSION : `${API_URL}/authRoutes/verify-session`,
    MENU_CONSOLE: `${API_URL}/companyRoutes/co_console_menu_items`,
    ROLES_CONSOLE: `${API_URL}/companyRoutes/roles`,
    
    
};

export default apiRoutes;

// NEXT_PUBLIC_API_BASE_URL=/api