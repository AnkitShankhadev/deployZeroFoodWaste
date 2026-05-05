import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Camera,
  Mail,
  Phone,
  MapPin,
  Users,
  Loader2,
  Check,
  AlertCircle,
  Calendar,
  Settings,
  Edit3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  profileImage?: string;
  totalPoints?: number;
  status: string;
  createdAt: string;
}

const roleColors: Record<string, { bg: string; text: string }> = {
  DONOR: { bg: "bg-blue-50", text: "text-blue-700" },
  NGO: { bg: "bg-green-50", text: "text-green-700" },
  VOLUNTEER: { bg: "bg-amber-50", text: "text-amber-700" },
  ADMIN: { bg: "bg-purple-50", text: "text-purple-700" },
};

const roleLabels: Record<string, string> = {
  DONOR: "Food Donor",
  NGO: "Non-Profit Organization",
  VOLUNTEER: "Volunteer",
  ADMIN: "Administrator",
};

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        if (user?.id) {
          const response = (await api.getUser(user.id)) as any;
          if (response.success && response.data?.user) {
            setProfile(response.data.user);
            setFormData({
              name: response.data.user.name || "",
              phone: response.data.user.phone || "",
              address: response.data.user.location?.address || "",
            });
            setProfilePreview(response.data.user.profileImage || "");
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = event.target?.result as string;
      setProfilePreview(preview);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    try {
      setIsSaving(true);

      const updateData = {
        name: formData.name,
        phone: formData.phone,
        location: {
          ...(profile?.location || { lat: 0, lng: 0 }),
          address: formData.address,
        },
        ...(profilePreview &&
          profilePreview !== profile?.profileImage && {
          profileImage: profilePreview,
        }),
      };

      const response = (await api.put(`/users/${user.id}`, updateData)) as any;

      if (response.success && response.data?.user) {
        setProfile(response.data.user);
        await refreshUser();
        setIsEditing(false);
        toast({
          title: "Success!",
          description: "Your profile has been updated.",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="w-full max-w-md border-0 shadow-lg shadow-border">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Profile Not Found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Unable to load your profile. Please try again later.
                </p>
                <Button onClick={() => navigate("/")} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pb-20">
        {/* Header / Cover Banner */}
        <div className="relative h-[280px] md:h-[340px] w-full bg-primary overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000"
            alt="Cover"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent"></div>

          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 md:left-12 inline-flex items-center text-primary-foreground/90 hover:text-primary-foreground bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-full transition-all text-sm font-semibold border border-white/20 hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>

        <div className="container mx-auto px-4 sm:px-6 md:px-12 max-w-6xl relative z-10">
          {/* Main Top Card */}
          <div className="bg-card rounded-[2rem] shadow-xl shadow-border/50 border border-border/60 -mt-24 mb-8 overflow-hidden relative">
            <div className="p-6 md:p-10 flex flex-col md:flex-row gap-6 md:items-end justify-between border-b border-border">
              <div className="flex flex-col md:flex-row gap-6 md:items-end">
                {/* Avatar */}
                <div className="relative -mt-20 md:-mt-28 z-20">
                  <div className="w-36 h-36 md:w-44 md:h-44 rounded-[2rem] bg-card p-2 shadow-2xl shadow-primary/10">
                    <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden relative group">
                      {profilePreview ? (
                        <img
                          src={profilePreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="text-6xl mb-1 text-primary-foreground font-extrabold">
                            {profile.name?.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      )}
                      {/* Hover Overlay for Edit */}
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleProfileImageClick}>
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      onClick={handleProfileImageClick}
                      className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-3.5 rounded-2xl hover:bg-primary/90 transition-transform shadow-xl hover:-translate-y-1 md:hidden"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                {/* Name & Title */}
                <div className="pb-2">
                  <div className="flex flex-wrap items-center gap-3 mb-2.5">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">
                      {profile.name}
                    </h1>

                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground font-semibold text-sm md:text-base">
                    <span className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-xl border border-border">
                      <div className={`w-2.5 h-2.5 rounded-full ${roleColors[profile.role]?.bg.replace('bg-', 'bg-').replace('50', '500') || 'bg-slate-500'}`}></div>
                      {roleLabels[profile.role] || profile.role}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5">
                      <MapPin className="w-4 h-4 opacity-70" />
                      {profile.location?.address || "Location not set"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pb-2 w-full md:w-auto mt-4 md:mt-0">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-xl shadow-primary/10 w-full md:w-auto h-12 px-8 gap-2 font-semibold transition-transform hover:-translate-y-0.5"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-3 w-full md:w-auto">
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                      className="rounded-2xl h-12 px-6 border-border text-muted-foreground w-full md:w-auto font-semibold hover:bg-muted"
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 h-12 px-8 w-full md:w-auto font-semibold transition-transform hover:-translate-y-0.5"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <><Check className="w-4 h-4 mr-2" /> Save</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Banner inside card */}
            <div className="bg-muted/50 flex grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border flex-col md:flex-row">
              <div className="p-6 md:p-8 flex-1 flex items-center gap-5 hover:bg-muted transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-secondary/30 text-secondary-foreground flex items-center justify-center flex-shrink-0 shadow-inner">
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Impact Points</p>
                  <p className="text-3xl font-black text-foreground tracking-tight">{profile.totalPoints || 0}</p>
                </div>
              </div>
              <div className="p-6 md:p-8 flex-1 flex items-center gap-5 hover:bg-muted transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-accent/30 text-accent-foreground flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Joined</p>
                  <p className="text-2xl font-black text-foreground tracking-tight">{new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Personal Info */}
            <div className="lg:col-span-4 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-[2rem] p-8 md:p-10 shadow-xl shadow-border/40 border border-border"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary-foreground">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-foreground tracking-tight">Personal Information</h3>
                    <p className="text-muted-foreground font-medium text-sm mt-0.5">Manage your private details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2 ml-1">
                      <Mail className="w-4 h-4 opacity-70" /> Email Address
                    </label>
                    <Input
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted border-border text-muted-foreground h-14 rounded-2xl px-4 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2 ml-1">
                      <Users className="w-4 h-4 opacity-70" /> Full Name
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your full name"
                      className={`h-14 rounded-2xl px-4 font-medium transition-all ${isEditing ? "bg-card border-ring focus:border-ring focus:ring-ring/20 shadow-md shadow-ring/5" : "bg-muted border-border text-foreground"}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2 ml-1">
                      <Phone className="w-4 h-4 opacity-70" /> Phone Number
                    </label>
                    <Input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your phone number"
                      className={`h-14 rounded-2xl px-4 font-medium transition-all ${isEditing ? "bg-card border-ring focus:border-ring focus:ring-ring/20 shadow-md shadow-ring/5" : "bg-muted border-border text-foreground"}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-bold text-foreground flex items-center gap-1 ml-1">
                      <MapPin className="w-4 h-4 opacity-70" /> Location Address
                    </label>
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your address"
                      className={`h-14 rounded-2xl px-4 font-medium transition-all ${isEditing ? "bg-card border-ring focus:border-ring focus:ring-ring/20 shadow-md shadow-ring/5" : "bg-muted border-border text-foreground"}`}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ProfilePage;
