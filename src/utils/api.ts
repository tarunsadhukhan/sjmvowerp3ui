
const API_URL=process.env.NEXT_PUBLIC_API_BASE_URL || '/apix';

const apiRoutes ={
    MENU_CTRLDESK : `${API_URL}/companyRoutes/console_menu_items`,
    SUPERADMINLOGINCONSOLE : `${API_URL}/authRoutes/loginconsole`,
    USERLOGINCONSOLE : `${API_URL}/authRoutes/login`,
    PROTECTED : `${API_URL}/authRoutes/protected`,
    VERIFYSESSION : `${API_URL}/authRoutes/verify-session`,
    
};

export default apiRoutes;

// NEXT_PUBLIC_API_BASE_URL=/api