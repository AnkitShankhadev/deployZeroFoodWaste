import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";

type AppRole = "DONOR" | "NGO" | "VOLUNTEER" | "ADMIN";

interface User {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  totalPoints?: number;
  phone?: string;
  status?: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (
    name: string,
    email: string,
    password: string,
    role: AppRole,
    location?: any,
    phone?: string,
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; user?: any }>;
  signOut: () => Promise<void>;
  updatePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const response = await api.getMe();
          if (response.success && response.data?.user) {
            const apiUser = response.data.user as any;
            const normalizedUser: User = {
              id: apiUser.id || apiUser._id,
              name: apiUser.name,
              email: apiUser.email,
              role: apiUser.role,
              location: apiUser.location,
              totalPoints: apiUser.totalPoints,
              phone: apiUser.phone,
              status: apiUser.status,
              profileImage: apiUser.profileImage,
            };
            setUser(normalizedUser);
            localStorage.setItem("user", JSON.stringify(normalizedUser));
          } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        } catch (error) {
          console.error("Failed to load user:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }

      setIsLoading(false);
    };

    loadUser();
  }, []);

  const signUp = async (
    name: string,
    email: string,
    password: string,
    role: AppRole,
    location?: any,
    phone?: string,
  ): Promise<{ error: Error | null }> => {
    try {
      console.log("📝 Registering user:", {
        name,
        email,
        role,
        location,
        phone,
      });

      const response = await api.register({
        name,
        email,
        password,
        role,
        location,
        phone,
      });

      console.log("✅ Registration response:", response);

      // ✅ FIX: Get token from root level or data.token
      const token = response.token;
      const userData = response.data?.user;

      if (token && userData) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        return { error: null };
      }

      return { error: new Error("No token received from server") };
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      return {
        error:
          error instanceof Error
            ? error
            : new Error(error.message || "Registration failed"),
      };
    }
  };

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: Error | null; user?: any }> => {
    // ✅ Add user?: any to return type
    try {
      console.log("🔐 Signing in:", email);

      const response = await api.login(email, password);

      console.log("✅ Login response:", response);

      const token = response.token;
      const userData = response.data?.user;

      if (token && userData) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        return { error: null, user: userData }; // ✅ Return user
      }

      return {
        error: new Error("No token received from server"),
        user: undefined,
      };
    } catch (error: any) {
      console.error("❌ Login error:", error);
      return {
        error:
          error instanceof Error
            ? error
            : new Error(error.message || "Invalid credentials"),
        user: undefined,
      };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ error: Error | null }> => {
    try {
      const response = await api.updatePassword(currentPassword, newPassword);

      if (response.success && response.token) {
        localStorage.setItem("token", response.token);
        return { error: null };
      }

      return { error: new Error("Password update failed") };
    } catch (error: any) {
      return {
        error:
          error instanceof Error ? error : new Error("Password update failed"),
      };
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await api.getMe();
      if (response.success && response.data?.user) {
        const apiUser = response.data.user as any;
        const normalizedUser: User = {
          id: apiUser.id || apiUser._id,
          name: apiUser.name,
          email: apiUser.email,
          role: apiUser.role,
          location: apiUser.location,
          totalPoints: apiUser.totalPoints,
          phone: apiUser.phone,
          status: apiUser.status,
          profileImage: apiUser.profileImage,
        };
        setUser(normalizedUser);
        localStorage.setItem("user", JSON.stringify(normalizedUser));
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signUp,
        signIn,
        signOut,
        updatePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
