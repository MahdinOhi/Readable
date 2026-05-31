import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Mail, Lock, Sparkles, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAuthSuccess: () => void;
}

export function AuthDialog({ open, onOpenChange, onAuthSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  // Email/Password fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      toast.error("Supabase is not configured yet. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);

    if (activeTab === "signup") {
      // REQUIRE gmail domain for signups
      if (!email.trim().toLowerCase().endsWith("@gmail.com")) {
        toast.error("Signups are restricted to Gmail (@gmail.com) accounts only.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account created! Please check your email for verification.");
        onAuthSuccess();
        onOpenChange(false);
      }
    } else {
      // Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Logged in successfully!");
        onAuthSuccess();
        onOpenChange(false);
      }
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Access Your Library</DialogTitle>
          </div>
          <DialogDescription>
            Authenticate with Supabase to read and sync your articles anywhere.
          </DialogDescription>
        </DialogHeader>

        {!supabase ? (
          <div className="py-4 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Your Supabase keys are not set up yet. Before logging in or signing up, you need to configure your Supabase URL and Anon Key in your backend environment variables.
            </p>
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-md">
              Connection required to enable cloud synchronization.
            </div>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as any);
            }}
            className="w-full mt-2"
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login" className="text-xs">
                Email Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-xs">
                Gmail Sign Up
              </TabsTrigger>
            </TabsList>

            {/* EMAIL LOGIN TAB */}
            <TabsContent value="login" className="pt-4">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email-login-field" className="text-xs font-semibold">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-login-field"
                      type="email"
                      placeholder="name@gmail.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pass-login-field" className="text-xs font-semibold">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pass-login-field"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In with Email"}
                </Button>
              </form>
            </TabsContent>

            {/* GMAIL SIGN UP TAB */}
            <TabsContent value="signup" className="pt-4">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="bg-primary/5 text-primary text-[11px] p-3 rounded-md leading-relaxed border border-primary/10">
                  ⚠️ <strong>Restriction:</strong> In accordance with specifications, you must use a standard <strong>@gmail.com</strong> address to create a new account.
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email-signup-field" className="text-xs font-semibold">Gmail Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-signup-field"
                      type="email"
                      placeholder="username@gmail.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pass-signup-field" className="text-xs font-semibold">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pass-signup-field"
                      type="password"
                      placeholder="Minimum 6 characters"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up with Gmail"}
                </Button>
              </form>
            </TabsContent>

          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
