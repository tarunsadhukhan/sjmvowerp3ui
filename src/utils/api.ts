
const API_URL=process.env.NEXT_PUBLIC_API_URL 

const apiRoutes ={
    MENU_CTRLDESK : `${API_URL}/api/companyRoutes/console_menu_items`,
    SUPERADMINLOGINCONSOLE : `${API_URL}/api/authRoutes/loginconsole`,
    USERLOGINCONSOLE : `${API_URL}/api/authRoutes/login`,
    PROTECTED : `${API_URL}/api/authRoutes/protected`,
    VERIFYSESSION : `${API_URL}/api/authRoutes/verify-session`,
    
};

export default apiRoutes;