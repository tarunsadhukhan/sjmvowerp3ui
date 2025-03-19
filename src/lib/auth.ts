export interface User {
    id: string
    email: string
    name?: string
    role?: string
  }
  
  export interface Company {
    id: string
    name: string
    code: string
  }
  
  export function setUser(user: User) {
    if (typeof window === 'undefined') return
    localStorage.setItem('user', JSON.stringify(user))
  }
  
  export function getUser(): User | null {
    if (typeof window === 'undefined') return null
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return null
      return JSON.parse(userStr)
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  }
  
  export function setCompany(company: Company) {
    if (typeof window === 'undefined') return
    localStorage.setItem('selectedCompany', JSON.stringify(company))
  }
  
  export function getCompany(): Company | null {
    if (typeof window === 'undefined') return null
    try {
      const companyStr = localStorage.getItem('selectedCompany')
      if (!companyStr) return null
      return JSON.parse(companyStr)
    } catch (error) {
      console.error('Error parsing company data:', error)
      return null
    }
  }
  
  export function isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    const user = getUser()
    return user !== null
  }
  
  export function logout() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('user')
    localStorage.removeItem('selectedCompany')
    window.location.href = '/'
  }

  export function urlcheck() {
    let compshow=1
      const currentHost = window.location.host; // Gets current domain
      console.log("Detected Host:", currentHost,window.location.href);
      if (currentHost === "admin.vowerp.co.in" || currentHost === "localhost:3001" ) {
          compshow=1
    } else {
         compshow=2
    }   
    return { compshow, currentHost }
  }


  export function urlfixed() {
    const subdomain = "vowsls3.vowerp.co.in"; 
   
    return { subdomain}
  }
