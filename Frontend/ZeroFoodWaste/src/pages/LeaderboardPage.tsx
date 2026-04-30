import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import {
  buildDonorAchievements,
  buildNGOAchievements,
  buildVolunteerAchievements,
  useAchievementNotifications,
  type Achievement,
} from "@/hooks/useAchievements";
import {
  Trophy,
  Star,
  TrendingUp,
  Gift,
  Building2,
  Users,
  Loader,
  Lock,
  ChevronRight,
  Medal,
} from "lucide-react";

type TabType = "donors" | "ngos" | "volunteers";

interface LeaderboardEntry {
  rank: number;
  userId: { _id?: string; name: string; email: string; profileImage?: string };
  totalPoints: number;
  donationsCount?: number;
  pickupsCount?: number;
  collectionsCount?: number;
}

interface UserRank {
  rank: number | null;
  totalPoints: number;
  totalUsers: number;
  percentile: string;
  donationsCount?: number;
  pickupsCount?: number;
  achievementsCount?: number;
  badgesCount?: number;
}

const roleMap: Record<TabType, string> = {
  donors: "DONOR",
  ngos: "NGO",
  volunteers: "VOLUNTEER",
};

const tabColors: Record<TabType, { active: string; bg: string; accent: string; badge: string }> = {
  donors: {
    active: "text-emerald-700 border-emerald-600 bg-emerald-50/60",
    bg: "from-emerald-700 to-teal-600",
    accent: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
  ngos: {
    active: "text-blue-700 border-blue-600 bg-blue-50/60",
    bg: "from-blue-700 to-indigo-700",
    accent: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
  },
  volunteers: {
    active: "text-violet-700 border-violet-600 bg-violet-50/60",
    bg: "from-violet-700 to-purple-700",
    accent: "text-violet-600",
    badge: "bg-violet-100 text-violet-700",
  },
};

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("donors");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const role = roleMap[activeTab];
        const response = await api.get<{
          success: boolean;
          data: { leaderboard: LeaderboardEntry[] };
        }>(`/leaderboard?role=${role}&limit=10`);
        setLeaderboardData(response.data.leaderboard || []);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError("Failed to load leaderboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [activeTab]);

  // Fetch user's rank
  useEffect(() => {
    const fetchUserRank = async () => {
      try {
        if (!user) return;
        const response = await api.get<{ success: boolean; data: UserRank }>(
          "/leaderboard/my-rank",
        );
        setUserRank(response.data);
      } catch (err) {
        console.error("Error fetching user rank:", err);
      }
    };

    fetchUserRank();
  }, [user]);

  // Build achievements based on user role
  const achievements: Achievement[] = useMemo(() => {
    if (!user) return [];

    const role = user.role?.toUpperCase();

    if (role === "DONOR") {
      return buildDonorAchievements({
        completed: userRank?.donationsCount ?? 0,
        active: 0,
        totalQuantity: 0,
        total: userRank?.donationsCount ?? 0,
      });
    } else if (role === "NGO") {
      return buildNGOAchievements({
        collectedKg: 0,
        activePickups: 0,
        completedCount: userRank?.donationsCount ?? 0,
        peopleFed: 0,
      });
    } else if (role === "VOLUNTEER") {
      return buildVolunteerAchievements({
        totalDeliveries: userRank?.pickupsCount ?? 0,
        deliveriesToday: 0,
        totalPoints: userRank?.totalPoints ?? user.totalPoints ?? 0,
      });
    }

    // Fallback: show donor achievements
    return buildDonorAchievements({
      completed: 0,
      active: 0,
      totalQuantity: 0,
      total: 0,
    });
  }, [user, userRank]);

  useAchievementNotifications(achievements, user?.id);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const colors = tabColors[activeTab];

  const tabs = [
    { id: "donors" as TabType, label: "Donors", icon: Gift },
    { id: "ngos" as TabType, label: "NGOs", icon: Building2 },
    { id: "volunteers" as TabType, label: "Volunteers", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8f5]">
      <Navbar />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Banner */}
          <div className={`relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-r ${colors.bg} shadow-xl`}>
            <div
              className="absolute inset-0 bg-cover bg-center opacity-10"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=1600')`,
              }}
            />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-8 md:p-10">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0"
                >
                  <Trophy className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <p className="text-white/60 text-sm font-semibold uppercase tracking-widest mb-1">
                    Community Rankings
                  </p>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                    Leaderboard & Achievements
                  </h1>
                  <p className="text-white/70 mt-1 text-sm">
                    Celebrating our top contributors making a difference
                  </p>
                </div>
              </div>
              {/* User mini-stats */}
              {userRank && (
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                      Your Rank
                    </p>
                    <p className="text-3xl font-black text-white">
                      {userRank.rank ? `#${userRank.rank}` : "—"}
                    </p>
                  </div>
                  <div className="w-px bg-white/20" />
                  <div className="text-center">
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                      Points
                    </p>
                    <p className="text-3xl font-black text-white">
                      {userRank.totalPoints?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="w-px bg-white/20" />
                  <div className="text-center">
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                      Top
                    </p>
                    <p className="text-3xl font-black text-white">
                      {userRank.percentile || "—"}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stat Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total Saved",
                value:
                  leaderboardData.length > 0
                    ? `${(leaderboardData.reduce((sum, item) => sum + (item.totalPoints || 0), 0) / 100).toFixed(0)} kg`
                    : "0 kg",
                emoji: "🌱",
                color: "from-emerald-50 to-green-50 ring-emerald-200/60",
              },
              {
                label: "Active Users",
                value: userRank?.totalUsers?.toLocaleString() || "0",
                emoji: "👥",
                color: "from-blue-50 to-indigo-50 ring-blue-200/60",
              },
              {
                label: "Your Points",
                value: userRank?.totalPoints?.toLocaleString() || "0",
                emoji: "💎",
                color: "from-violet-50 to-purple-50 ring-violet-200/60",
              },
              {
                label: "Achievements",
                value: `${unlockedCount}/${achievements.length}`,
                emoji: "🏆",
                color: "from-amber-50 to-orange-50 ring-amber-200/60",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`bg-gradient-to-br ${stat.color} ring-1 rounded-2xl p-5 text-center shadow-sm`}
              >
                <span className="text-2xl mb-2 block">{stat.emoji}</span>
                <div className="text-2xl font-black text-slate-800 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Leaderboard Table */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-sm bg-white overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 px-4 py-3.5 flex items-center justify-center gap-2 text-sm font-semibold transition-all border-b-2 ${
                        activeTab === tab.id
                          ? `${colors.active} border-current`
                          : "text-muted-foreground hover:text-slate-700 border-transparent"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Leaderboard List */}
                <div className="divide-y divide-slate-100">
                  {loading ? (
                    <div className="p-10 text-center">
                      <Loader className="w-5 h-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
                    </div>
                  ) : error ? (
                    <div className="p-10 text-center">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  ) : leaderboardData.length === 0 ? (
                    <div className="p-10 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <Trophy className="w-7 h-7 text-slate-400" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No leaderboard data available yet
                      </p>
                    </div>
                  ) : (
                    leaderboardData.map((item, index) => (
                      <motion.div
                        key={`${item.userId._id || item.userId.email}-${item.rank}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className={`px-5 py-4 flex items-center gap-4 hover:bg-slate-50/80 transition-colors ${
                          item.rank <= 3
                            ? "bg-gradient-to-r from-amber-50/40 to-transparent"
                            : ""
                        }`}
                      >
                        {/* Rank */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                            item.rank === 1
                              ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md"
                              : item.rank === 2
                                ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md"
                                : item.rank === 3
                                  ? "bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md"
                                  : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.rank <= 3
                            ? ["🥇", "🥈", "🥉"][item.rank - 1]
                            : item.rank}
                        </div>

                        {/* Avatar placeholder + Name */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-800 text-sm truncate">
                            {item.userId.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activeTab === "donors" &&
                              `${item.donationsCount || 0} donations`}
                            {activeTab === "ngos" &&
                              `${item.collectionsCount || 0} collections`}
                            {activeTab === "volunteers" &&
                              `${item.pickupsCount || 0} deliveries`}
                          </div>
                        </div>

                        {/* Points */}
                        <div className="text-right flex-shrink-0">
                          <div className="font-black text-slate-800 text-sm">
                            {item.totalPoints?.toLocaleString() || 0}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                            points
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Achievements Sidebar */}
            <div className="space-y-5">
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    Your Achievements
                    <span className={`ml-auto inline-flex items-center justify-center rounded-full text-[10px] font-bold px-2 py-0.5 ${colors.badge}`}>
                      {unlockedCount}/{achievements.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-0">
                  {achievements.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <Medal className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Sign in to track your achievements
                      </p>
                    </div>
                  ) : (
                    achievements.map((achievement) => (
                      <motion.div
                        key={achievement.id}
                        initial={false}
                        animate={achievement.unlocked ? { scale: [1, 1.02, 1] } : {}}
                        transition={{ duration: 0.4 }}
                        className={`flex items-start gap-3 p-3 rounded-2xl transition-all ${
                          achievement.unlocked
                            ? `bg-gradient-to-r ${
                                activeTab === "donors"
                                  ? "from-emerald-50 to-teal-50 ring-1 ring-emerald-200/80"
                                  : activeTab === "ngos"
                                    ? "from-blue-50 to-indigo-50 ring-1 ring-blue-200/80"
                                    : "from-violet-50 to-purple-50 ring-1 ring-violet-200/80"
                              }`
                            : "bg-slate-50/80"
                        }`}
                      >
                        {/* Emoji badge */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm ${
                            achievement.unlocked
                              ? "bg-white"
                              : "bg-slate-100 grayscale opacity-50"
                          }`}
                        >
                          {achievement.unlocked ? (
                            achievement.emoji
                          ) : (
                            <Lock className="w-4 h-4 text-slate-400" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p
                              className={`text-xs font-bold truncate ${
                                achievement.unlocked
                                  ? "text-slate-800"
                                  : "text-slate-400"
                              }`}
                            >
                              {achievement.name}
                            </p>
                            {achievement.unlocked && (
                              <span
                                className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors.badge}`}
                              >
                                ✓ Done
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-[10px] leading-tight mb-1.5 ${
                              achievement.unlocked
                                ? "text-muted-foreground"
                                : "text-slate-400"
                            }`}
                          >
                            {achievement.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={achievement.progress}
                              className={`h-1.5 flex-1 ${
                                achievement.unlocked ? "" : "opacity-40"
                              }`}
                            />
                            <span
                              className={`text-[10px] font-semibold flex-shrink-0 ${
                                achievement.unlocked
                                  ? colors.accent
                                  : "text-slate-400"
                              }`}
                            >
                              {achievement.progressLabel}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                <CardContent className="p-5">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                    💡 Tips to Climb
                  </h4>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 mt-0.5 text-amber-500 flex-shrink-0" />
                      <span>Complete donations regularly to earn steady points</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 mt-0.5 text-amber-500 flex-shrink-0" />
                      <span>Unlock achievements for bonus recognition</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 mt-0.5 text-amber-500 flex-shrink-0" />
                      <span>Higher quantity donations earn more points per action</span>
                    </li>
                  </ul>
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

export default LeaderboardPage;
