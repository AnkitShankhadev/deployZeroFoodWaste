import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Leaf, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  Users, 
  HandHeart,
  ArrowLeft,
  Eye,
  EyeOff,
  MapPin
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

type AuthMode = "login" | "register";
type UserRole = "donor" | "ngo" | "volunteer";

const roles = [
  { id: "donor" as UserRole, label: "Donor", icon: HandHeart, description: "Donate surplus food" },
  { id: "ngo" as UserRole, label: "NGO", icon: Building2, description: "Collect and distribute" },
  { id: "volunteer" as UserRole, label: "Volunteer", icon: Users, description: "Help with delivery" },
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<AuthMode>((searchParams.get("mode") as AuthMode) || "login");
  const [selectedRole, setSelectedRole] = useState<UserRole>((searchParams.get("role") as UserRole) || "donor");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: {
      lat: 0,
      lng: 0,
      address: ""
    }
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard/donor");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const modeParam = searchParams.get("mode") as AuthMode;
    const roleParam = searchParams.get("role") as UserRole;
    if (modeParam) setMode(modeParam);
    if (roleParam) setSelectedRole(roleParam);
  }, [searchParams]);

  const getLocation = () => {
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Please enter your address manually below.",
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Update lat/lng immediately so the GPS box shows
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            lat: latitude,
            lng: longitude,
          },
        }));

        // Reverse-geocode with Nominatim to fill in a readable address
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const readableAddress = data.display_name ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

          setFormData((prev) => ({
            ...prev,
            location: {
              lat: latitude,
              lng: longitude,
              address: readableAddress,
            },
          }));

          toast({
            title: "Location detected ✅",
            description: readableAddress.slice(0, 80),
          });
        } catch {
          // Nominatim failed but we still have coordinates
          toast({
            title: "Location detected ✅",
            description: `${latitude.toFixed(4)}, ${longitude.toFixed(4)} — enter address name below if needed.`,
          });
        }

        setIsGettingLocation(false);
      },
      (error) => {
        let errorTitle = "Location error";
        let errorMessage = "Could not get your location. Please enter your address manually.";

        if (error.code === error.PERMISSION_DENIED) {
          errorTitle = "Permission Denied";
          errorMessage =
            "Location access was denied. Enable it in your browser's site settings, or type your address below.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorTitle = "Position Unavailable";
          errorMessage = "Your device could not determine your location. Please enter it manually.";
        } else if (error.code === error.TIMEOUT) {
          errorTitle = "Timed Out";
          errorMessage = "The location request timed out. Check your GPS/network and try again.";
        }

        toast({ title: errorTitle, description: errorMessage, variant: "destructive" });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: false, // faster, uses network/WiFi
        timeout: 10000,            // 10 s — don't make the user wait 30 s
        maximumAge: 60000,         // accept cached position up to 1 min old
      }
    );
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error, user } = await signIn(formData.email, formData.password);  // ✅ Destructure user
        
        if (error) {
          toast({
            title: "Login failed",
            description: error.message || "Invalid email or password",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You've successfully logged in.",
          });
          
          // ✅ Use the actual user role from backend
          const dashboardMap: Record<string, string> = {
            VOLUNTEER: "/dashboard/volunteer",
            DONOR: "/dashboard/donor",
            NGO: "/dashboard/ngo",
          };
          
          // ✅ Navigate based on user's actual role
          navigate(dashboardMap[user?.role] || "/dashboard/donor");
        }
      }else {
        // Register - validate required fields
        if (!formData.name) {
          toast({
            title: "Validation error",
            description: "Please provide your full name",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Validate location - either GPS coordinates OR manual address is required
        if ((!formData.location.lat || !formData.location.lng) && !formData.location.address.trim()) {
          toast({
            title: "Location required",
            description: "Please either use 'Get My Location' or enter your address manually",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Convert role to backend format
        const roleMap: Record<UserRole, "DONOR" | "NGO" | "VOLUNTEER"> = {
          donor: "DONOR",
          ngo: "NGO",
          volunteer: "VOLUNTEER",
        };

        const { error } = await signUp(
          formData.name,
          formData.email,
          formData.password,
          roleMap[selectedRole],
          formData.location,
          formData.phone
        );

        if (error) {
          toast({
            title: "Registration failed",
            description: error.message || "Failed to create account",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account created!",
            description: `Your ${selectedRole} account has been created.`,
          });
          const dashboardMap: Record<UserRole, string> = {
            donor: "/dashboard/donor",
            ngo: "/dashboard/ngo",
            volunteer: "/dashboard/volunteer",
          };
          navigate(dashboardMap[selectedRole]);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
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

        <div className="relative z-10 flex flex-col justify-center p-12 text-white w-full">
          <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to home
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Leaf className="w-7 h-7" />
              </div>
              <span className="text-3xl font-bold">ZeroFoodWaste</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              {mode === "login" ? "Welcome Back!" : "Join Our Mission"}
            </h1>
            <p className="text-xl text-green-100">
              {mode === "login" 
                ? "Sign in to continue making a difference in your community."
                : "Create an account and start saving food today."}
            </p>
          </div>

          <div className="space-y-6">
            {[
              { icon: "🍎", text: "50,000+ kg of food saved" },
              { icon: "🤝", text: "10,000+ active community members" },
              { icon: "🏆", text: "Earn rewards for every donation" },
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

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-tl-full" />
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full" />
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 bg-[#fafaf8]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Zero<span className="text-primary">FoodWaste</span>
            </span>
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-slate-500 text-sm">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setMode("register")}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div
                  key="role-selection"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <Label>I want to join as</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                          selectedRole === role.id
                            ? "border-primary bg-green-50 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <role.icon className={`w-6 h-6 mx-auto mb-2 ${
                          selectedRole === role.id ? "text-primary" : "text-muted-foreground"
                        }`} />
                        <div className="font-medium text-sm">{role.label}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10 h-12"
                      required={mode === "register"}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {mode === "register" && (
                <>
                  <motion.div
                    key="phone-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+977 9800000000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-12"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    key="location-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <Label>Location </Label>
                    <p className="text-sm text-muted-foreground">
                      Use GPS or enter your address manually
                    </p>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={getLocation}
                      disabled={isGettingLocation}
                    >
                      {isGettingLocation ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                          Getting location...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 mr-2" />
                          Use My Current Location
                        </>
                      )}
                    </Button>
                    
                    {formData.location.lat !== 0 && formData.location.lng !== 0 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          GPS Location: {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                        </p>
                      </div>
                    )}

               

                    <div>
                      <Input
                        placeholder="Enter your address (e.g., Kathmandu, Nepal)"
                        value={formData.location.address}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          location: { ...formData.location, address: e.target.value }
                        })}
                        className="h-12"
                      />
                      {formData.location.address && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          ✓ Address entered
                        </p>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {mode === "login" && (
              <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}

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
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">or continue with</span>
              </div>
            </div>

            <Button type="button" variant="outline" size="lg" className="w-full">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;