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
// import { cn } from "../../utils/protected"
import { Loader2 } from "lucide-react"
// import { setUser } from "@/utils/auth"
// import { urlcheck } from "@/utils/auth";
//import axios from "axios"
import Swal from "sweetalert2";
import { login,loginConsole } from "@/components/auth/login_auth"
//import apiRoutes from "@/utils/api"

interface LoginFormsProps {
  subdomain: string | null;
}
// Moved inside the LoginForm function to avoid undefined error
const formSchema = z.object({
  username: z.string().min(1,"user name must be 1 charecter"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(false),
  loginType: z.string().optional(),
})

export function LoginForm({ subdomain }: LoginFormsProps) {
  const [isLoading, setIsLoading] = useState(false)
  console.log('subdomain loginform', subdomain); // Moved here to avoid undefined error
  const [autoLoginType, setAutoLoginType] = useState<string | null>(null); 
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
      let data: { status?: number; message?: string, access_token?: string, user_id?: string } = {};
    
      if (subdomain === "admin" || values.loginType === "admin") {
        data = await loginConsole(values.username, values.password, values.loginType || "portal", values.rememberMe);
      } else {
        data = await login(values.username, values.password, values.loginType || "portal", values.rememberMe);
      }

      if (typeof window !== 'undefined') {
        console.log("API Response Data:", document.cookie);
        console.log("API Response Data:", data);
  
        if (data.status === 200) {
          // ✅ Success: Set cookie, localStorage, and route
          document.cookie = `access_token=${data.access_token}; domain=admin.localhost; path=/; max-age=3600; HttpOnly; SameSite=Lax`;
          localStorage.setItem("user_id", data.user_id ?? "");
          localStorage.setItem("subdomain", subdomain ?? "");
        
          if (subdomain === "admin") {
            router.push(`/dashboardctrldesk`);
          } else if (values.loginType === "portal") {
            router.push(`/dashboardportal`);
          } else {
            router.push(`/dashboardadmin`);
          }
        
        } else {
          // ❌ Error: Show SweetAlert with backend error message
          Swal.fire({
            title: "Login Failed",
            text: data.message || "Invalid username or passwords",
            icon: "error",
            confirmButtonText: "OK",
          });
          setIsLoading(false);
        }
      }
    } catch (error) {
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Something went wrong during login.";

      Swal.fire({
        title: "Login Faileds",
        text: errMsg,
        icon: "error",
        confirmButtonText: "OK",
      });
      setIsLoading(false);
    } 
  }
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
            className={`w-full bg-[#9BC837] hover:bg-[#8BB72E] text-white ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
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