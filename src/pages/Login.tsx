
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "Successfully logged in.",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const companyName = formData.get('company') as string;
    const userName = formData.get('name') as string;
    const email = formData.get('signup-email') as string;
    const password = formData.get('signup-password') as string;

    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: userName.split(' ')[0] || userName,
            last_name: userName.split(' ').slice(1).join(' ') || '',
            company_name: companyName,
          }
        }
      });

      if (authError) {
        toast({
          title: "Sign Up Failed",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      if (authData.user && !authData.session) {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account, then sign in.",
        });
        setActiveTab("login");
      } else if (authData.user && authData.session) {
        // User is automatically signed in, handle company creation
        try {
          // Create company record
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .insert({
              name: companyName,
              email: email,
            })
            .select()
            .single();

          if (companyError) {
            console.error('Company creation error:', companyError);
            toast({
              title: "Setup Incomplete", 
              description: "Account created but company setup failed. Please contact support.",
              variant: "destructive",
            });
            return;
          }

          // Wait a bit for profile creation trigger to complete
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Update user profile with company_id
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              company_id: companyData.id,
              first_name: userName.split(' ')[0] || userName,
              last_name: userName.split(' ').slice(1).join(' ') || '',
            })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error('Profile update error:', profileError);
          }

          toast({
            title: "Account created successfully!",
            description: "Welcome to your AI HR Platform.",
          });
          navigate('/dashboard');
        } catch (error) {
          console.error('Error during company/profile setup:', error);
          toast({
            title: "Setup Error",
            description: "Account created but setup incomplete. Please try logging in.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Sign Up Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt("Enter your email address:");
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard`,
      });

      if (error) {
        toast({
          title: "Reset Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset Email Sent",
          description: "Check your email for password reset instructions.",
        });
      }
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hr-gray to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-hr-navy mb-2">AI HR Platform</h1>
          <p className="text-gray-600">Professional recruitment made simple</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-hr-navy">Get Started</CardTitle>
            <CardDescription className="text-center">
              Access your recruitment dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@company.com"
                      required
                      className="h-11"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="h-11"
                      disabled={loading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-hr-purple hover:bg-hr-purple/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-hr-purple hover:underline"
                      disabled={loading}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      placeholder="Your Company"
                      required
                      className="h-11"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      required
                      className="h-11"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="signup-email"
                      type="email"
                      placeholder="your@company.com"
                      required
                      className="h-11"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="signup-password"
                      type="password"
                      required
                      className="h-11"
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-hr-purple hover:bg-hr-purple/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
