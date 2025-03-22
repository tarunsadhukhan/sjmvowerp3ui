import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
    <html lang="en">
      <body className={`${inter.className}`}>
      {/*   <AuthProvider>    */}
          {children}
         {/* </AuthProvider>  */}
      </body>
    </html>
  );
}
