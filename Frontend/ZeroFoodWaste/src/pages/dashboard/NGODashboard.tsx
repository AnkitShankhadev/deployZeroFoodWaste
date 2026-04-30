import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Building2,
  Package,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  MapPin,
  ChevronRight,
  Bell,
  Truck,
  Eye,
  Lock,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { buildNGOAchievements, useAchievementNotifications } from "@/hooks/useAchievements";

type DonationStatus =
  | "CREATED"
  | "ACCEPTED"
  | "ASSIGNED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | "EXPIRED";

interface NearbyDonation {
  _id: string;
  foodType: string;
  quantity: string;
  expiryDate: string;
  status: DonationStatus;
  location?: {
    lat: number;
    lng: number;
    address?: string;
    distance?: string;
  };
  donorId?: {
    name: string;
  };
}

interface AcceptedDonation {
  _id: string;
  foodType: string;
  quantity: string;
  donorId?: {
    name: string;
  };
  assignedVolunteer?: {
    name: string;
  };
  status: DonationStatus;
}

const typeColors: Record<string, string> = {
  vegetables: "bg-green-100 text-green-700",
  bakery: "bg-amber-100 text-amber-700",
  cooked: "bg-orange-100 text-orange-700",
  dairy: "bg-blue-100 text-blue-700",
};

const NGODashboard = () => {
  const { user } = useAuth();
  const [nearbyDonations, setNearbyDonations] = useState<NearbyDonation[]>([]);
  const [acceptedDonations, setAcceptedDonations] = useState<
    AcceptedDonation[]
  >([]);
  const [completedDonations, setCompletedDonations] = useState<
    AcceptedDonation[]
  >([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [isLoadingAccepted, setIsLoadingAccepted] = useState(false);
  const [errorNearby, setErrorNearby] = useState<string | null>(null);
  const [errorAccepted, setErrorAccepted] = useState<string | null>(null);

  const lat = user?.location?.lat;
  const lng = user?.location?.lng;

  useEffect(() => {
    const loadNearby = async () => {
      setIsLoadingNearby(true);
      setErrorNearby(null);
      try {
        if (lat == null || lng == null) {
          // Fallback: show all available donations if NGO has no location set
          const response = await api.getDonations({
            status: "CREATED",
            limit: 50,
          });
          setNearbyDonations(response.data?.donations || []);
        } else {
          const response = await api.getNearbyDonations({
            lat,
            lng,
            radius: 10,
            status: "CREATED",
          });
          setNearbyDonations(response.data?.donations || []);
        }
      } catch (err: any) {
        console.error("Failed to load nearby donations:", err);
        const message = err.message || "Failed to load nearby donations";
        setErrorNearby(message);
        toast({
          title: "Could not load nearby donations",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsLoadingNearby(false);
      }
    };

    loadNearby();
  }, [lat, lng]);

  useEffect(() => {
    const loadAccepted = async () => {
      setIsLoadingAccepted(true);
      setErrorAccepted(null);
      try {
        const response = await api.getDonations({
          limit: 100,
        });
        const all = response.data?.donations || [];
        const inProgressDonations = all.filter((d: any) => {
          const acceptedBy = d.acceptedBy;
          const isMine =
            acceptedBy &&
            (acceptedBy._id === user?.id || acceptedBy.id === user?.id);
          const inProgress =
            d.status === "ACCEPTED" ||
            d.status === "ASSIGNED" ||
            d.status === "IN_TRANSIT";
          return isMine && inProgress;
        });
        const completedDonationsList = all.filter((d: any) => {
          const acceptedBy = d.acceptedBy;
          const isMine =
            acceptedBy &&
            (acceptedBy._id === user?.id || acceptedBy.id === user?.id);
          return isMine && d.status === "DELIVERED";
        });
        setAcceptedDonations(inProgressDonations);
        setCompletedDonations(completedDonationsList);
      } catch (err: any) {
        console.error("Failed to load NGO donations:", err);
        const message = err.message || "Failed to load NGO donations";
        setErrorAccepted(message);
        toast({
          title: "Could not load NGO donations",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsLoadingAccepted(false);
      }
    };

    if (user?.role === "NGO") {
      loadAccepted();
    }
  }, [user]);

  const stats = useMemo(() => {
    const inProgressKg = acceptedDonations.reduce((sum, d) => {
      const num = parseFloat(d.quantity);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    const completedKg = completedDonations.reduce((sum, d) => {
      const num = parseFloat(d.quantity);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    const totalCollectedKg = inProgressKg + completedKg;

    return {
      collectedKg: totalCollectedKg,
      activePickups: acceptedDonations.length,
      peopleFed: totalCollectedKg * 2,
      completedCount: completedDonations.length,
    };
  }, [acceptedDonations, completedDonations]);

  const achievements = useMemo(
    () => buildNGOAchievements({
      collectedKg: stats.collectedKg,
      activePickups: stats.activePickups,
      completedCount: stats.completedCount,
      peopleFed: stats.peopleFed,
    }),
    [stats]
  );

  useAchievementNotifications(achievements, user?.id);

  return (
    <div className="min-h-screen bg-[#f7f8f5]">
      <Navbar />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Greeting Banner */}
          <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-r from-blue-700 to-indigo-700 shadow-xl">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-15"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=1600')` }}
            />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-8 md:p-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-1">NGO Dashboard</p>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{user?.name || "Your NGO"}</h1>
                  <p className="text-blue-100/80 mt-1 text-sm">{nearbyDonations.length} new donations available nearby</p>
                </div>
              </div>
              <Link to="/map">
                <Button size="lg" className="gap-2 bg-white text-blue-700 font-bold hover:bg-blue-50 rounded-full px-6 shadow-lg hover:-translate-y-0.5 transition-all">
                  <MapPin className="w-5 h-5" /> View Map
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: "Food Collected",
                value: `${stats.collectedKg.toFixed(1)} kg`,
                change: "Based on accepted donations",
                icon: Package,
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                title: "Active Pickups",
                value: stats.activePickups.toString(),
                change: "Accepted and in progress",
                icon: Truck,
                color: "text-blue-600",
                bg: "bg-blue-100",
              },
              {
                title: "People Fed (est.)",
                value: `${stats.peopleFed}`,
                change: "Estimated at 2 people per kg",
                icon: Users,
                color: "text-purple-600",
                bg: "bg-purple-100",
              },
              {
                title: "Impact Points",
                value: (user?.totalPoints ?? 0).toString(),
                change: "From completed donations",
                icon: TrendingUp,
                color: "text-green-600",
                bg: "bg-green-100",
              },
            ].map((stat, index) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 bg-white overflow-hidden">
                  <div style={{ background: stat.color.includes('primary') ? 'hsl(152 60% 32%)' : stat.color.includes('blue') ? '#2563eb' : stat.color.includes('purple') ? '#7c3aed' : '#16a34a' }} className="h-1 w-full" />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{stat.title}</p>
                        <p className="text-4xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                        <p className="text-sm text-muted-foreground mt-1.5">{stat.change}</p>
                      </div>
                      <div className={`p-3 rounded-2xl ${stat.bg}`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Available Donations */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Available Donations
                </CardTitle>
                <Link to="/donations">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View all
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingNearby ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    Loading nearby donations...
                  </div>
                ) : errorNearby ? (
                  <div className="p-4 text-sm text-red-600">{errorNearby}</div>
                ) : nearbyDonations.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    No available donations at the moment.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {nearbyDonations.map((donation, index) => (
                      <motion.div
                        key={donation._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-foreground">
                                {donation.foodType}
                              </h4>
                              <Badge
                                variant="secondary"
                                className={
                                  typeColors[
                                    donation.foodType?.toLowerCase()
                                  ] || "bg-green-100 text-green-700"
                                }
                              >
                                {donation.foodType}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Package className="w-4 h-4" />
                                {donation.quantity}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {donation.location?.address ||
                                  "Unknown location"}
                              </span>
                              <span className="flex items-center gap-1 text-amber-600">
                                <Clock className="w-4 h-4" />
                                Expires{" "}
                                {donation.expiryDate
                                  ? `on ${new Date(
                                      donation.expiryDate,
                                    ).toLocaleDateString()} ${new Date(
                                      donation.expiryDate,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}`
                                  : "soon"}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              From: {donation.donorId?.name || "Unknown donor"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/donations/${donation._id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            </Link>
                            <Button variant="hero" size="sm">
                              Accept
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Accepted Donations - In Progress */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-500" />
                  In Progress ({acceptedDonations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingAccepted ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    Loading accepted donations...
                  </div>
                ) : errorAccepted ? (
                  <div className="p-4 text-sm text-red-600">
                    {errorAccepted}
                  </div>
                ) : acceptedDonations.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    You haven&apos;t accepted any donations yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {acceptedDonations.map((donation, index) => (
                      <motion.div
                        key={donation._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-foreground">
                                {donation.foodType}
                              </h4>
                              <Badge
                                variant="outline"
                                className={
                                  donation.status === "ASSIGNED"
                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                    : donation.status === "IN_TRANSIT"
                                      ? "bg-green-100 text-green-700 border-green-200"
                                      : "bg-purple-100 text-purple-700 border-purple-200"
                                }
                              >
                                {donation.status === "ASSIGNED"
                                  ? "Volunteer Assigned"
                                  : donation.status === "IN_TRANSIT"
                                    ? "In Transit"
                                    : donation.status === "ACCEPTED"
                                      ? "Awaiting Volunteer"
                                      : donation.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Package className="w-4 h-4" />
                                {donation.quantity}
                              </span>
                              {donation.assignedVolunteer?.name && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {donation.assignedVolunteer.name}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              From: {donation.donorId?.name || "Unknown donor"}
                            </p>
                          </div>
                          <div className="text-right">
                            <Button variant="ghost" size="sm" className="mt-2">
                              Track
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Collections */}
            <Card className="border-border/50 lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Recently Completed ({completedDonations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {completedDonations.length > 0 ? (
                    completedDonations.slice(0, 3).map((donation, index) => (
                      <motion.div
                        key={donation._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl bg-green-50 border border-green-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h4 className="font-medium text-foreground">
                            {donation.foodType}
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {donation.quantity} from{" "}
                          {donation.donorId?.name || "Unknown donor"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Delivered
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No completed collections yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-0 shadow-sm bg-white lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Achievements
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5">
                    {achievements.filter(a => a.unlocked).length}/{achievements.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {achievements.map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      initial={false}
                      animate={achievement.unlocked ? { scale: [1, 1.02, 1] } : {}}
                      transition={{ duration: 0.4 }}
                      className={`flex items-start gap-3 p-3 rounded-2xl transition-all ${
                        achievement.unlocked
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 ring-1 ring-blue-200/80"
                          : "bg-slate-50/80"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm ${
                        achievement.unlocked ? "bg-white" : "bg-slate-100 grayscale opacity-50"
                      }`}>
                        {achievement.unlocked ? achievement.emoji : <Lock className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={`text-xs font-bold truncate ${achievement.unlocked ? "text-slate-800" : "text-slate-400"}`}>
                            {achievement.name}
                          </p>
                          {achievement.unlocked && (
                            <span className="flex-shrink-0 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">✓ Done</span>
                          )}
                        </div>
                        <p className={`text-[10px] leading-tight mb-1.5 ${achievement.unlocked ? "text-muted-foreground" : "text-slate-400"}`}>
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress value={achievement.progress} className={`h-1.5 flex-1 ${achievement.unlocked ? "" : "opacity-40"}`} />
                          <span className={`text-[10px] font-semibold flex-shrink-0 ${achievement.unlocked ? "text-blue-600" : "text-slate-400"}`}>
                            {achievement.progressLabel}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NGODashboard;
