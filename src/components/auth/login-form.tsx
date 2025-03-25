"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
 FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { cn } from "../../utils/protected"
import { Loader2 } from "lucide-react"
import { setUser } from "@/utils/auth"
import { urlcheck } from "@/utils/auth";

import { login,loginConsole } from "@/components/auth/login_auth"


interface LoginFormsProps {
  subdomain: string | null;
}
// console.log('subdomain loginform', subdomain); // Moved inside the LoginForm function
// Moved inside the LoginForm function to avoid undefined error
const formSchema = z.object({
  username: z.string().min(1,"user name must be 1 charecter"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(false),
  loginType: z.string().optional(),
})

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
// console.log('start',API_URL)
const {  compshow} = urlcheck();
 

export function LoginForm({ subdomain }: LoginFormsProps) {
  // console.log('subdomain', subdomain);
  const [isLoading, setIsLoading] = useState(false)
  console.log('subdomain loginform', subdomain); // Moved here to avoid undefined error
  const [autoLoginType, setAutoLoginType] = useState<string | null>(null); 
 // const [error, setError] = useState("")
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
      loginType: "portal",

    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    console.log('Check subdomain passed as prop to login form component:', subdomain);
    try {
      let data: { status_code: number; message: string; user_id?: string; access_token?: string } = { status_code: 0, message: "" };
  
      if (subdomain === "admin" || values.loginType === "admin") {
        data = await loginConsole(values.username, values.password, values.loginType || "portal", values.rememberMe) as { status_code: number; message: string; user_id?: string; access_token?: string };
      } else {
        data = await login(values.username, values.password, values.loginType || "portal", values.rememberMe);
      }
  
      console.log("API Response Data:", data); // Log the response data for testing
  
      if (data.status_code === 200) {
        const user = {
          id: data.user_id,
          token: data.access_token,
          subdomain: subdomain, // Add subdomain to the user object
        };
  
        // Save user_id and access_token in local storage
        localStorage.setItem("user_id", data.user_id || "");
        localStorage.setItem("access_token", data.access_token || "");
  
        document.cookie = `access_token=${data.access_token}; path=/; secure; samesite=strict`;
  
        if (subdomain === "admin") {
          router.push(`/dashboardctrldesk`);
        } else if (values.loginType === "portal") {
          router.push(`/${subdomain}/dashboardportal`);
        } else {
          router.push(`/${subdomain}/dashboardadmin`);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  }
  

// useEffect(() => {
//   const currentHost = window.location.host; // Gets current domain
//   console.log("Detected Host:", currentHost);

//   if (currentHost === "admin.vowsls.co.in" || currentHost === "localhost:3001" ) {
//     setAutoLoginType("admin"); // Set Admin Login Type
//     console.log(currentHost,'console admin')
//    // form.setValue("loginType", "admin"); // Update form state
//   } else {
//     setAutoLoginType(null); // Default Portal Login
//     form.setValue("loginType", "portal");
//   }
// }, [form]);

useEffect(() => {
  if (subdomain === "admin") {
    setAutoLoginType("admin"); // Set AutoLoginType explicitly to admin
  } else {
    setAutoLoginType(null); // Default Portal Login
  }
}, [subdomain]);
  



  return (
    <div className="login-container" >

      <div className="text-center">
        <h2 className="login-h2">Login</h2>
        <p className="mt-2 text-sm text-gray-300">
          Welcome to VOW ERP Solutions. Start your journey with simple email ID login.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Name</FormLabel>
                <FormControl>
                <Input
              className="input-custom-login"
              placeholder="User Name"
              {...field}
            />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
               
                  <Input  className="input-custom-login" type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

 {/* Show Login Type Selection Only If Not Auto-Detected */}
 {autoLoginType === null && (
            <div className="flex items-center justify-between mt-0">
              <FormField
                control={form.control}
                name="loginType"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="radio"
                        id="adminLogin"
                        value="admin"
                        checked={field.value === "admin"}
                        onChange={() => field.onChange("admin")}
                        className="w-4 h-4"
                      />
                    </FormControl>
                    <FormLabel htmlFor="adminLogin" className="text-sm">
                      Admin Login
                    </FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="loginType"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="radio"
                        id="portalLogin"
                        value="portal"
                        checked={field.value === "portal"}
                        onChange={() => field.onChange("portal")}
                        className="w-4 h-4"
                      />
                    </FormControl>
                    <FormLabel htmlFor="portalLogin" className="text-sm">
                      Portal Login
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          )} 

          <div className="flex items-center justify-between mt-0">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm">Keep me signed in</FormLabel>
                </FormItem>
              )}
            />
            <Button className="text-sm text-blue-600">
              Forgot Password?
            </Button>
          </div>

          <Button
            type="submit"
            className={cn(
              "w-full bg-[#9BC837] hover:bg-[#8BB72E] text-white",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log in
          </Button>
        </form>
      </Form>
    </div>
  )
}