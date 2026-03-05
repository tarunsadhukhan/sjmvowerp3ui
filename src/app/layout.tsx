import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SidebarCompaniesGuardClient from '@/components/clientside/SidebarCompaniesGuardClient';
import { AppThemeProvider } from '@/styles/AppThemeProvider';

const inter = Inter({ subsets: ["latin"] });
/* 
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
}); */
/* 
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
}); */

export const metadata: Metadata = {
  title: "VowErp",
  description: "ERP",
  icons: {
    icon: "/favicon-16x16.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className}`} suppressHydrationWarning>
        {/* <AuthProvider>    */}
          <AppThemeProvider>
            <SidebarCompaniesGuardClient />
            {children}
          </AppThemeProvider>
         {/* </AuthProvider>  */}
      </body>
    </html>
  );
}
