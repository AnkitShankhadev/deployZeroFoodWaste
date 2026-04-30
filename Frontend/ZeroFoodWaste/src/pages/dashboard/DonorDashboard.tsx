import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Plus,
  Package,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  ChevronRight,
  Trophy,
  Star,
  Leaf,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { buildDonorAchievements, useAchievementNotifications } from "@/hooks/useAchievements";

type DonationStatus = "CREATED" | "ACCEPTED" | "ASSIGNED" | "DELIVERED" | "CANCELLED";

interface Donation {
  _id: string;
  foodType: string;
  quantity: number;
  unit?: string;
  status: DonationStatus;
  expiryDate: string;
  createdAt: string;
  donorId: {
    name: string;
    email: string;
  };
  acceptedBy?: {
    name: string;
  } | null;
}

const statusColors: Record<DonationStatus | "PENDING" | "ACTIVE", string> = {
  CREATED: "bg-amber-100 text-amber-700 border-amber-200",
  ACCEPTED: "bg-blue-100 text-blue-700 border-blue-200",
  ASSIGNED: "bg-purple-100 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  ACTIVE: "bg-blue-100 text-blue-700 border-blue-200",
};

const statusLabels: Record<DonationStatus | "PENDING" | "ACTIVE", string> = {
  CREATED: "Pending",
  ACCEPTED: "Accepted",
  ASSIGNED: "Assigned",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  PENDING: "Pending",
  ACTIVE: "Active",
};

const DonorDashboard = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDonations = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.getDonations({
          donorId: user.id,
          limit: 50,
        });

        const mine = response.data?.donations || [];
        setDonations(mine);
      } catch (err: any) {
        console.error("Failed to load donations:", err);
        setError(err.message || "Failed to load donations");
        toast({
          title: "Could not load donations",
          description: err.message || "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDonations();
  }, [user]);

  const stats = useMemo(() => {
    const total = donations.length;
    const completed = donations.filter((d) => d.status === "DELIVERED").length;
    const active = donations.filter(
      (d) => d.status === "CREATED" || d.status === "ACCEPTED" || d.status === "ASSIGNED"
    ).length;

    const totalQuantity = donations
      .filter((d) => d.status === "DELIVERED")
      .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

    return {
      total,
      completed,
      active,
      totalQuantity,
    };
  }, [donations]);

  const recentDonations = useMemo(
    () =>
      [...donations]
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.expiryDate).getTime() -
            new Date(a.createdAt || a.expiryDate).getTime()
        )
        .slice(0, 5),
    [donations]
  );

  const achievements = useMemo(
    () => buildDonorAchievements(stats),
    [stats]
  );

  // Fire toast notifications when new achievements unlock
  useAchievementNotifications(achievements, user?.id);

  return (
    <div className="min-h-screen bg-[#f7f8f5]">
      <Navbar />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Greeting Banner */}
          <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-r from-emerald-700 to-teal-600 shadow-xl">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-luminosity"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=1600')` }}
            />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-8 md:p-10">
              <div>
                <p className="text-emerald-200 text-sm font-semibold uppercase tracking-widest mb-1">Donor Dashboard</p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  Welcome back, {user?.name?.split(' ')[0] || "Donor"} 👋
                </h1>
                <p className="text-emerald-100/80 mt-2 text-base">
                  Here's what's happening with your donations
                </p>
              </div>
              <Link to="/create-donation">
                <Button size="lg" className="gap-2 bg-white text-emerald-700 font-bold hover:bg-emerald-50 rounded-full px-6 shadow-lg hover:-translate-y-0.5 transition-all">
                  <Plus className="w-5 h-5" />
                  New Donation
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: "Total Donations",
                value: stats.total.toString(),
                change: `${stats.completed} completed`,
                icon: Package,
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                title: "Active Donations",
                value: stats.active.toString(),
                change: "Pending / accepted / assigned",
                icon: Clock,
                color: "text-amber-600",
                bg: "bg-amber-100",
              },
              {
                title: "Completed Donations",
                value: stats.completed.toString(),
                change: `${stats.totalQuantity} total quantity`,
                icon: CheckCircle,
                color: "text-green-600",
                bg: "bg-green-100",
              },
              {
                title: "Impact Points",
                value: (user?.totalPoints ?? 0).toString(),
                change: "Points earned from your impact",
                icon: TrendingUp,
                color: "text-blue-600",
                bg: "bg-blue-100",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 bg-white overflow-hidden">
                  <div className={`h-1 w-full ${stat.bg.replace('/10','').replace('bg-','bg-')} opacity-80`}
                    style={{ background: stat.color.includes('primary') ? 'hsl(152 60% 32%)' : stat.color.includes('amber') ? '#d97706' : stat.color.includes('green') ? '#16a34a' : '#2563eb' }}
                  />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {stat.title}
                        </p>
                        <p className="text-4xl font-black text-slate-800 tracking-tight">
                          {stat.value}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1.5">
                          {stat.change}
                        </p>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Donations */}
            <div className="lg:col-span-2 space-y-0">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Recent Donations</CardTitle>
                  <Link to="/donations">
                    <Button variant="ghost" size="sm" className="gap-1">
                      View all
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-6 text-sm text-muted-foreground">
                      Loading your donations...
                    </div>
                  ) : error ? (
                    <div className="p-6 text-sm text-red-600">{error}</div>
                  ) : recentDonations.length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground">
                      You haven&apos;t created any donations yet. Create your first one to see it here.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {recentDonations.map((donation, index) => (
                        <motion.div
                          key={donation._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="px-6 py-4 hover:bg-slate-50/80 transition-colors group"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h4 className="font-semibold text-slate-800 truncate">
                                    {donation.foodType}
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs flex-shrink-0 ${
                                      statusColors[
                                        (donation.status as DonationStatus) || "PENDING"
                                      ]
                                    }`}
                                  >
                                    {
                                      statusLabels[
                                        (donation.status as DonationStatus) || "PENDING"
                                      ]
                                    }
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    {donation.quantity} {donation.unit || ""}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(
                                      donation.createdAt || donation.expiryDate
                                    ).toLocaleDateString()}
                                  </span>
                                  {donation.acceptedBy?.name && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {donation.acceptedBy.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 transition-colors flex-shrink-0" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Achievements & Progress */}
            <div className="space-y-5">
              {/* Level Progress */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-700">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white text-2xl font-black flex items-center justify-center shadow-lg flex-shrink-0">
                      {Math.max(1, Math.floor((user?.totalPoints ?? 0) / 100) + 1)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Level {Math.max(1, Math.floor((user?.totalPoints ?? 0) / 100) + 1)} Donor</p>
                      <p className="text-sm text-muted-foreground">{user?.totalPoints ?? 0} total points</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                      <span>Next level</span>
                      <span>{(user?.totalPoints ?? 0) % 100}/100 pts</span>
                    </div>
                    <Progress value={((user?.totalPoints ?? 0) % 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Achievements
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5">
                      {achievements.filter(a => a.unlocked).length}/{achievements.length}
                    </span>
                  </CardTitle>
                  <Link to="/leaderboard">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                      Leaderboard <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-0">
                  {achievements.map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      initial={false}
                      animate={achievement.unlocked ? { scale: [1, 1.02, 1] } : {}}
                      transition={{ duration: 0.4 }}
                      className={`relative flex items-start gap-3 p-3 rounded-2xl transition-all ${
                        achievement.unlocked
                          ? "bg-gradient-to-r from-emerald-50 to-teal-50 ring-1 ring-emerald-200/80"
                          : "bg-slate-50/80"
                      }`}
                    >
                      {/* Emoji badge */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm ${
                        achievement.unlocked ? "bg-white" : "bg-slate-100 grayscale opacity-50"
                      }`}>
                        {achievement.unlocked ? achievement.emoji : <Lock className="w-4 h-4 text-slate-400" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={`text-xs font-bold truncate ${
                            achievement.unlocked ? "text-slate-800" : "text-slate-400"
                          }`}>
                            {achievement.name}
                          </p>
                          {achievement.unlocked && (
                            <span className="flex-shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                              ✓ Done
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] leading-tight mb-1.5 ${
                          achievement.unlocked ? "text-muted-foreground" : "text-slate-400"
                        }`}>
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={achievement.progress}
                            className={`h-1.5 flex-1 ${achievement.unlocked ? "" : "opacity-40"}`}
                          />
                          <span className={`text-[10px] font-semibold flex-shrink-0 ${
                            achievement.unlocked ? "text-emerald-600" : "text-slate-400"
                          }`}>
                            {achievement.progressLabel}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-5">
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <Link to="/create-donation" className="block">
                      <Button variant="outline" className="w-full justify-start gap-2 h-10 text-sm hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all">
                        <Plus className="w-4 h-4" /> Create Donation
                      </Button>
                    </Link>
                    <Link to="/map" className="block">
                      <Button variant="outline" className="w-full justify-start gap-2 h-10 text-sm hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all">
                        <MapPin className="w-4 h-4" /> View Nearby NGOs
                      </Button>
                    </Link>
                    <Link to="/leaderboard" className="block">
                      <Button variant="outline" className="w-full justify-start gap-2 h-10 text-sm hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-all">
                        <Trophy className="w-4 h-4" /> Check Leaderboard
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DonorDashboard;
