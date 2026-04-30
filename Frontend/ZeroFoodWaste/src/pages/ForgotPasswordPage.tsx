import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

type ForgotPasswordStep = "email" | "sent" | "reset";

const ForgotPasswordPage = () => {
  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenFromUrl = searchParams.get("token") || "";
  const emailFromUrl = searchParams.get("email") || "";

  // If user opened the page with a valid token param, go directly to reset step
  useEffect(() => {
    if (tokenFromUrl) {
      setStep("reset");
      if (emailFromUrl) {
        setEmail(emailFromUrl);
      }
    }
  }, [tokenFromUrl, emailFromUrl]);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.forgotPassword(email);

      toast({
        title: "Reset link sent",
        description:
          response.message || "If that email is registered, a reset link has been sent.",
      });

      setStep("sent");
    } catch (error: any) {
      toast({
        title: "Could not send reset link",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    if (!tokenFromUrl) {
      toast({
        title: "Invalid reset link",
        description: "The reset link is missing or invalid. Please request a new one.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.resetPassword(tokenFromUrl, newPassword);

      toast({
        title: "Password reset successful!",
        description: response.message || "You can now log in with your new password.",
      });

      // After successful reset, redirect to login
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "The reset link may be invalid or expired.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-green-900">
        {/* Photographic Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 mix-blend-overlay opacity-60"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200')` }}
        />
        {/* Gradient Overlay for Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-green-950 via-green-900/80 to-green-800/40 z-0" />

        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <Link
            to="/auth"
            className="absolute top-8 left-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to login
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Leaf className="w-7 h-7" />
              </div>
              <span className="text-3xl font-bold">ZeroFoodWaste</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Reset Your Password</h1>
            <p className="text-xl text-green-100">
              Don't worry, it happens to the best of us. We'll help you get back
              to saving food in no time.
            </p>
          </div>

          {/* Decorative elements */}
          <div className="space-y-6">
            {[
              { icon: "🔒", text: "Secure password reset process" },
              { icon: "📧", text: "Reset link sent to your email" },
              { icon: "⚡", text: "Quick and easy recovery" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-lg text-green-100">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 bg-[#fafaf8]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Zero<span className="text-primary">FoodWaste</span>
            </span>
          </Link>

          {step === "email" && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Forgot your password?
                </h2>
                <p className="text-muted-foreground">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>
              </div>

              <form onSubmit={handleSendReset} className="space-y-6">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <Link
                  to="/auth"
                  className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </form>
            </>
          )}

          {step === "sent" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Check your email
              </h2>
              <p className="text-muted-foreground mb-6">
                We've sent a password reset link to{" "}
                <span className="font-medium text-foreground">{email}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => setStep("email")}
                  className="text-primary hover:underline"
                >
                  try again
                </button>
              </p>

              {/* For demo purposes, show reset form button */}
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => setStep("reset")}
              >
                Demo: Go to Reset Password
              </Button>

              <Link
                to="/auth"
                className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </motion.div>
          )}

          {step === "reset" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Create new password
                </h2>
                <p className="text-muted-foreground">
                  Your new password must be at least 8 characters long.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 mt-1.5"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 mt-1.5"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
