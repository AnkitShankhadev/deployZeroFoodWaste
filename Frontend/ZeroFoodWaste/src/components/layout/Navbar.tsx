import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Leaf,
  Menu,
  X,
  Home,
  Gift,
  Map,
  Trophy,
  LogIn,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationDropdown } from "./NotificationDropdown";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
    setIsOpen(false);
  };

  const { isAuthenticated, user, signOut } = useAuth();

  const getDashboardPath = () => {
    if (!user) return "/dashboard/donor";
    const roleMap: Record<string, string> = {
      DONOR: "/dashboard/donor",
      NGO: "/dashboard/ngo",
      VOLUNTEER: "/dashboard/volunteer",
      ADMIN: "/dashboard/admin",
    };
    return roleMap[user.role] || "/dashboard/donor";
  };

  // Base navigation links


  // Protected navigation links (only show when authenticated)
  const protectedNavLinks = [
    {
      href:
        user?.role === "DONOR"
          ? "/dashboard/donor"
          : user?.role === "NGO"
            ? "/dashboard/ngo"
            : user?.role === "VOLUNTEER"
              ? "/dashboard/volunteer"
              : user?.role === "ADMIN"
                ? "/dashboard/admin"
                : "/",
      label: "Dashboard",
      icon: Home,
      requiresAuth: false,
    },
    { href: "/donations", label: "Donations", icon: Gift, requiresAuth: true },
    { href: "/map", label: "Map", icon: Map, requiresAuth: true },
    {
      href: "/leaderboard",
      label: "Leaderboard",
      icon: Trophy,
      requiresAuth: true,
    },
  ];

  // Filter navLinks based on authentication status
  const navLinks = [
    ...(isAuthenticated ? protectedNavLinks : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/75 dark:bg-card/80 backdrop-blur-xl border-b border-black/[0.06] dark:border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
              <Leaf className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              Zero<span className="text-emerald-600">FoodWaste</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 pr-4">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link key={link.href} to={link.href} className="group relative py-2">
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${isActive ? "text-primary font-semibold" : "text-foreground/80 hover:text-primary"
                      }`}
                  >
                    {link.label}
                  </span>
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${isActive ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <NotificationDropdown />
                <Link to="/profile" className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="gap-2">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-bold text-white">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    {user?.name || "Dashboard"}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    Login
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-2">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className="block"
                    >
                      <Button
                        variant={isActive ? "soft" : "ghost"}
                        className={`w-full justify-start transition-all duration-300 ${isActive ? "text-primary pl-6 border-l-2 border-primary rounded-l-none" : "hover:pl-6 hover:text-primary"
                          }`}
                      >
                        {link.label}
                      </Button>
                    </Link>
                  );
                })}
                <div className="pt-4 border-t border-border space-y-2">
                  {isAuthenticated ? (
                    <>
                      <div className="px-2 py-2">
                        <p className="text-xs text-muted-foreground font-semibold mb-2 px-2">
                          Notifications
                        </p>
                        <NotificationDropdown />
                      </div>
                      <Link to="/profile" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full gap-2">
                          {user?.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={user.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-bold text-white">
                              {user?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                          )}
                          Profile
                        </Button>
                      </Link>
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setIsOpen(false)}
                      >
                        <Button variant="outline" className="w-full gap-2">
                          {user?.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={user.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-bold text-white">
                              {user?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                          )}
                          {user?.name || "Dashboard"}
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full gap-2"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/auth" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full gap-2">
                          <LogIn className="w-4 h-4" />
                          Login
                        </Button>
                      </Link>
                      <Link to="/auth" onClick={() => setIsOpen(false)}>
                        <Button variant="hero" className="w-full">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};
