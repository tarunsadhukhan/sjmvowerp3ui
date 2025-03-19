
//import { useEffect } from "react"
//import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import Image from "next/image"
//import { isAuthenticated } from "@/lib/auth"
//import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import backlogo from "@/components/asstes/images/background.png"

export default function Home() {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user')
    if (user) {
      redirect('/dashboard')
    }
  }
 /*  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard")
    }
  }, [router])
 */


  
  return (
    <main className="min-h-screen flex">
      {/* Left side - Welcome Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-800 to-teal-600 p-12 relative">
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{ backgroundImage: `url(${backlogo.src})` }}
  >
    {/* Background Image */}
  </div>

  {/* Centering the text */}
  <div className="relative flex flex-col items-center justify-center w-full h-full text-white z-10">
    <h1 className="text-2xl font-bold text-center mb-12">Nice to meet you</h1>
    <h2 className="text-6xl font-bold text-center mb-12">WELCOME</h2>
    <p className="text-xm text-center">
      We have customized this product according to your needs and can&apos;t wait to see you using this product. This will simplify the working of your business.
    </p>
  </div>
</div>

     {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <Image
              src="/dashboard/vow_logo.png"
              alt="VOW Log"
              width={150}
              height={60}
              priority
            />
          </div>
          <div className="text-center space-y-1">
      
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
