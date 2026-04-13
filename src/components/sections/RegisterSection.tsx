"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input as UIInput } from "@/components/ui/input";
import { ChevronRight, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Google Icon SVG component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export function RegisterSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const restaurantName = formData.get("restaurantName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Create user account
      await signUp({
        email,
        password,
        restaurantName,
      });

      // Create restaurant document in Firestore
      // Note: The user ID will be available after signUp completes
      // We'll handle restaurant creation in the AuthContext after signup
      
      toast.success("Account created successfully! Redirecting...");
      
      // Redirect to home page, which will automatically redirect to dashboard
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Failed to create account. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google successfully! Redirecting...");
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <section
      id="register"
      className="w-full py-20 md:py-28 lg:py-32 bg-white"
    >
      <div className="container px-6 md:px-12">
        <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-light border border-green-200 text-green-DEFAULT text-sm font-medium">
            <Zap className="h-4 w-4" />
            <span>Get started in minutes</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-green-DEFAULT">
            Get Started Today
          </h2>
          <p className="max-w-2xl text-green-medium/70 text-lg leading-relaxed">
            Register your restaurant, upload your menu, and start accepting orders in minutes
          </p>
        </div>
        <div className="mx-auto max-w-md">
          <Card className="border-2 border-green-100 shadow-2xl rounded-2xl bg-white p-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="restaurant-name" className="sr-only">
                  Restaurant Name
                </label>
                <UIInput 
                  id="restaurant-name"
                  name="restaurantName"
                  placeholder="Restaurant Name" 
                  type="text" 
                  required
                  autoComplete="organization"
                  className="h-14 rounded-xl border-2 border-green-100 focus:border-green-DEFAULT text-base"
                  aria-label="Restaurant name"
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <UIInput 
                  id="email"
                  name="email"
                  placeholder="Email" 
                  type="email" 
                  required
                  className="h-14 rounded-xl border-2 border-green-100 focus:border-green-DEFAULT text-base"
                  aria-label="Email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <UIInput 
                  id="password"
                  name="password"
                  placeholder="Password" 
                  type="password" 
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="h-14 rounded-xl border-2 border-green-100 focus:border-green-DEFAULT text-base"
                  aria-label="Password"
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                aria-label="Create account"
                className="w-full h-14 rounded-xl bg-green hover:bg-green-medium text-white text-base font-semibold shadow-lg shadow-green-DEFAULT/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-green-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-green-medium/60">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-14 rounded-xl border-2 border-green-100 hover:border-green-200 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                aria-label="Sign up with Google"
              >
                <GoogleIcon />
                <span>{isGoogleLoading ? "Signing up..." : "Sign up with Google"}</span>
              </Button>

              <p className="text-xs text-green-medium/60 text-center pt-2">
                By creating an account, you agree to our Terms &amp;
                Conditions and Privacy Policy
              </p>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
}
