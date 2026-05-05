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
  Bike,
  Package,
  Clock,
  CheckCircle,
  MapPin,
  Navigation,
  ChevronRight,
  Trophy,
  Star,
  Phone,
  Building2,
  ArrowRight,
  Timer,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { buildVolunteerAchievements, useAchievementNotifications } from "@/hooks/useAchievements";

const foodTypeEmojis: Record<string, string> = {
  Vegetables: "🥕",
  Bakery: "🍞",
  "Cooked Food": "🍱",
  Dairy: "🥛",
  Fruits: "🍎",
  Packaged: "🥫",
  Grains: "🌾",
  Meat: "🍖",
  Seafood: "🐟",
};

type AssignmentStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface Assignment {
  _id: string;
  status: AssignmentStatus;
  donationId: {
    _id: string;
    foodType: string;
    quantity: string;
    expiryDate: string;
    donorId?: {
      name: string;
      address?: string;
      phone?: string;
      location?: {
        address?: string;
      };
    };
    acceptedBy?: {
      name: string;
      location?: {
        address?: string;
      };
      phone?: string;
    };
  };
  assignedAt: string;
  completedAt?: string;
}

interface AvailableTask {
  _id: string;
  foodType: string;
  quantity: string;
  status: string;
  donorId: {
    name: string;
    phone?: string;
    location?: {
      address?: string;
    };
    address?: string;
  };
  acceptedBy: {
    name: string;
    phone?: string;
    location?: {
      address?: string;
    };
  };
  createdAt: string;
}

const VolunteerDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableTasks, setAvailableTasks] = useState<AvailableTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [isAcceptingTask, setIsAcceptingTask] = useState(false);
  const [isMarkingPickedUp, setIsMarkingPickedUp] = useState(false);
  const [isMarkingCompleted, setIsMarkingCompleted] = useState(false);

  useEffect(() => {
    const loadAssignments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.getMyAssignments();
        setAssignments(response.data?.assignments || []);
      } catch (err: any) {
        console.error("Failed to load assignments:", err);
        const message = err.message || "Failed to load your tasks";
        setError(message);
        toast({
          title: "Could not load your deliveries",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const loadAvailableTasks = async () => {
      setIsLoadingTasks(true);
      setTaskError(null);
      try {
        const response = await api.getAvailableTasks();
        setAvailableTasks(response.data?.donations || []);
      } catch (err: any) {
        console.error("Failed to load available tasks:", err);
        const message = err.message || "Failed to load available tasks";
        setTaskError(message);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    if (user?.role === "VOLUNTEER") {
      loadAssignments();
      loadAvailableTasks();
    }
  }, [user]);

  const currentTask = useMemo(() => {
    return (
      assignments.find((a) => a.status === "IN_PROGRESS") ||
      assignments.find((a) => a.status === "PENDING")
    );
  }, [assignments]);

  const completedToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return assignments
      .filter((a) => {
        if (a.status !== "COMPLETED" || !a.completedAt) return false;
        const completedDate = new Date(a.completedAt);
        return completedDate >= today;
      })
      .slice(0, 5)
      .map((a) => ({
        id: a._id,
        title: a.donationId?.foodType || "Food Delivery",
        quantity: a.donationId?.quantity || "N/A",
        points: 50, // Points per task - adjust based on your system
      }));
  }, [assignments]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deliveriesToday = assignments.filter((a) => {
      if (a.status !== "COMPLETED" || !a.completedAt) return false;
      const completedDate = new Date(a.completedAt);
      return completedDate >= today;
    }).length;

    const totalDeliveries = assignments.filter(
      (a) => a.status === "COMPLETED",
    ).length;

    return {
      deliveriesToday,
      totalDeliveries,
    };
  }, [assignments]);

  const achievements = useMemo(
    () => buildVolunteerAchievements({
      totalDeliveries: stats.totalDeliveries,
      deliveriesToday: stats.deliveriesToday,
      totalPoints: user?.totalPoints ?? 0,
    }),
    [stats, user?.totalPoints]
  );

  useAchievementNotifications(achievements, user?.id);

  const handleMarkPickedUp = async () => {
    if (!currentTask) return;

    setIsMarkingPickedUp(true);
    try {
      // Update assignment status to IN_PROGRESS
      await api.updateAssignmentStatus(currentTask._id, "IN_PROGRESS");

      toast({
        title: "Marked as picked up!",
        description: "Good luck with your delivery!",
      });

      // Reload assignments to reflect the updated status
      const response = await api.getMyAssignments();
      setAssignments(response.data?.assignments || []);
    } catch (err: any) {
      toast({
        title: "Failed to update status",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsMarkingPickedUp(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!currentTask) return;

    setIsMarkingCompleted(true);
    try {
      // Complete the assignment
      await api.completeAssignment(currentTask._id);

      await refreshUser();

      toast({
        title: "Delivery completed!",
        description: "Great job! Points have been added to your account.",
      });

      // Reload assignments
      const response = await api.getMyAssignments();
      setAssignments(response.data?.assignments || []);

      // Reload available tasks
      const tasksResponse = await api.getAvailableTasks();
      setAvailableTasks(tasksResponse.data?.donations || []);
    } catch (err: any) {
      toast({
        title: "Failed to complete delivery",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsMarkingCompleted(false);
    }
  };

  const handleAcceptTask = async (donationId: string) => {
    setIsAcceptingTask(true);
    try {
      await api.acceptTask(donationId);
      await refreshUser();

      toast({
        title: "Task accepted!",
        description: "Check your current delivery section.",
      });

      // Reload both assignments and available tasks
      const assignmentsResponse = await api.getMyAssignments();
      setAssignments(assignmentsResponse.data?.assignments || []);

      const tasksResponse = await api.getAvailableTasks();
      setAvailableTasks(tasksResponse.data?.donations || []);
    } catch (err: any) {
      toast({
        title: "Failed to accept task",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsAcceptingTask(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Greeting Banner */}
          <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-r from-primary to-accent shadow-xl">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-luminosity"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&q=80&w=1600')` }}
            />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-8 md:p-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <Bike className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-primary-foreground/80 text-sm font-semibold uppercase tracking-widest mb-1">Volunteer Dashboard</p>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-primary-foreground tracking-tight">
                    Hey, {user?.name?.split(' ')[0] || "Volunteer"}
                  </h1>
                  <p className="text-primary-foreground/60 mt-1 text-sm">
                    {currentTask ? "You have an active delivery" : "No active deliveries right now"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-primary-foreground/80 text-xs font-semibold uppercase tracking-wider">Today's Earnings</p>
                  <p className="text-3xl font-black text-primary-foreground">{stats.deliveriesToday * 50} pts</p>
                </div>
                <Link to="/map">
                  <Button size="lg" className="gap-2 bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 rounded-full px-6 shadow-lg hover:-translate-y-0.5 transition-all">
                    <Navigation className="w-5 h-5" /> Open Map
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
              {
                title: "Deliveries Today",
                value: stats.deliveriesToday.toString(),
                change: "Goal: 5 deliveries",
                icon: Package,
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                title: "Total Deliveries",
                value: stats.totalDeliveries.toString(),
                change: "All time",
                icon: CheckCircle,
                color: "text-green-600",
                bg: "bg-green-100",
              },
              {
                title: "Impact Points",
                value: (user?.totalPoints ?? 0).toString(),
                change: "Earned from completed tasks",
                icon: Trophy,
                color: "text-amber-600",
                bg: "bg-amber-100",
              },
            ].map((stat, index) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 bg-card overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{stat.title}</p>
                        <p className="text-4xl font-black text-foreground tracking-tight">{stat.value}</p>
                        <p className="text-sm text-muted-foreground mt-1.5">{stat.change}</p>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Task */}
            <div className="lg:col-span-2">
              <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                      Active Delivery
                    </CardTitle>
                    <Badge className="bg-primary/20 text-primary border-primary/30 font-semibold text-xs">
                      {currentTask ? currentTask.status.replace("_", " ") : "None"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {isLoading ? (
                    <div className="text-center py-8"><p className="text-sm text-muted-foreground">Loading your tasks...</p></div>
                  ) : error ? (
                    <div className="text-center py-8"><p className="text-sm text-destructive">{error}</p></div>
                  ) : !currentTask ? (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 border border-border">
                        <Bike className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No active delivery right now</p>
                      <p className="text-xs text-muted-foreground mt-1">Check available tasks below</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between bg-muted rounded-2xl px-4 py-3">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{currentTask.donationId.foodType}</h3>
                          <p className="text-sm text-muted-foreground">{currentTask.donationId.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Assigned at</p>
                          <p className="text-base font-bold text-primary">
                            {new Date(currentTask.assignedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>

                      {/* Route visualization */}
                      <div className="flex items-stretch gap-3">
                        {/* Pickup */}
                        <div className="flex-1 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-xl bg-amber-500 flex items-center justify-center">
                              <MapPin className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pickup</span>
                          </div>
                          <h4 className="font-semibold text-foreground text-sm">{currentTask.donationId.donorId?.name || "Donor"}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {currentTask.donationId.donorId?.location?.address || currentTask.donationId.donorId?.address || "Address not available"}
                          </p>
                          {currentTask.donationId.donorId?.phone && (
                            <a href={`tel:${currentTask.donationId.donorId.phone}`} className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline font-medium">
                              <Phone className="w-3 h-3" />{currentTask.donationId.donorId.phone}
                            </a>
                          )}
                        </div>
                        {/* Arrow */}
                        <div className="flex items-center justify-center px-1">
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                        {/* Dropoff */}
                        <div className="flex-1 p-4 rounded-2xl bg-secondary/20 border border-secondary/30">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold text-secondary-foreground uppercase tracking-wider">Drop-off</span>
                          </div>
                          <h4 className="font-semibold text-foreground text-sm">{currentTask.donationId.acceptedBy?.name || "NGO"}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {currentTask.donationId.acceptedBy?.location?.address || "Address not available"}
                          </p>
                          {currentTask.donationId.acceptedBy?.phone && (
                            <a href={`tel:${currentTask.donationId.acceptedBy.phone}`} className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline font-medium">
                              <Phone className="w-3 h-3" />{currentTask.donationId.acceptedBy.phone}
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-1">
                        <Button variant="outline" className="flex-1 gap-2 rounded-xl h-11 border-border hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all">
                          <Navigation className="w-4 h-4" />Navigate
                        </Button>
                        {currentTask.status === "PENDING" ? (
                          <Button className="flex-1 gap-2 rounded-xl h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold" onClick={handleMarkPickedUp} disabled={isMarkingPickedUp}>
                            {isMarkingPickedUp ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Picking up...</> : <><CheckCircle className="w-4 h-4" />Mark as Picked Up</>}
                          </Button>
                        ) : (
                          <Button className="flex-1 gap-2 rounded-xl h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-2 border-primary" onClick={handleMarkCompleted} disabled={isMarkingCompleted}>
                            {isMarkingCompleted ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Completing...</> : <><CheckCircle className="w-4 h-4" />Mark as Completed</>}
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Progress & Stats */}
            <div className="space-y-5">
              {/* Daily Progress */}
              <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                    <Star className="w-4 h-4 text-amber-500" />
                    Daily Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 mb-3">
                    <p className="text-5xl font-black text-foreground tracking-tight">{stats.deliveriesToday}</p>
                    <p className="text-2xl font-bold text-muted-foreground mb-1">/5</p>
                  </div>
                  <Progress value={Math.min(100, (stats.deliveriesToday / 5) * 100)} className="h-2.5 mb-3" />
                  <p className="text-xs font-medium text-muted-foreground">
                    {stats.deliveriesToday >= 5 ? "🎉 Goal achieved! Great work!" : `${5 - stats.deliveriesToday} more for bonus`}
                  </p>
                </CardContent>
              </Card>
              {/* Completed Today */}
              <Card className="border-border shadow-sm bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Completed Today
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {completedToday.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No deliveries yet today</p>
                  ) : (
                    completedToday.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-lg">
                            {foodTypeEmojis[task.title] || "🍽️"}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{task.title}</p>
                            <p className="text-xs text-muted-foreground">{task.quantity} kg</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-primary/20 text-primary font-bold text-xs">+{task.points} pts</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Available Tasks */}
            <Card className="border-border shadow-sm bg-card lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Available Tasks from NGOs
                </CardTitle>
                <Link to="/map">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-muted-foreground hover:text-primary">
                    View on map <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {isLoadingTasks ? (
                  <div className="text-center py-8"><p className="text-sm text-muted-foreground">Loading available tasks...</p></div>
                ) : taskError ? (
                  <div className="text-center py-8"><p className="text-sm text-destructive">{taskError}</p></div>
                ) : availableTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 border border-border">
                      <Clock className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No available tasks right now. Check back soon!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {availableTasks.map((task, index) => (
                      <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="p-4 rounded-2xl border border-border bg-muted/30 hover:border-primary/40 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-foreground text-sm">{task.foodType}</h4>
                            <p className="text-xs text-muted-foreground">{task.quantity}</p>
                          </div>
                          <Badge variant="secondary" className="bg-primary/20 text-primary font-bold text-xs">+50 pts</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground mb-4">
                          <p className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">
                              {task.donorId?.name || "Donor"} (
                              {task.donorId?.location?.address ||
                                task.donorId?.address ||
                                "Address not available"}
                              )
                            </span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate">
                              {task.acceptedBy?.name || "NGO"} (
                              {task.acceptedBy?.location?.address ||
                                "Address not available"}
                              )
                            </span>
                          </p>
                          {task.donorId?.phone && (
                            <p className="flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              <a
                                href={`tel:${task.donorId.phone}`}
                                className="text-primary hover:underline"
                              >
                                {task.donorId.phone}
                              </a>
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border-secondary font-bold border-2"
                          size="sm"
                          onClick={() => handleAcceptTask(task._id)}
                          disabled={isAcceptingTask}
                        >
                          {isAcceptingTask ? (
                            <>
                              <div className="w-3 h-3 border-2 border-secondary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                              Accepting...
                            </>
                          ) : (
                            "Accept Task"
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-border shadow-sm bg-card lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Achievements
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5">
                    {achievements.filter(a => a.unlocked).length}/{achievements.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {achievements.map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      initial={false}
                      animate={achievement.unlocked ? { scale: [1, 1.02, 1] } : {}}
                      transition={{ duration: 0.4 }}
                      className={`flex items-start gap-3 p-3 rounded-2xl transition-all ${achievement.unlocked
                        ? "bg-gradient-to-r from-primary/5 to-accent/5 ring-1 ring-primary/40"
                        : "bg-muted/50"
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm ${achievement.unlocked ? "bg-card border border-border" : "bg-muted grayscale opacity-50 border border-border"
                        }`}>
                        {achievement.unlocked ? achievement.emoji : <Lock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={`text-xs font-bold truncate ${achievement.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                            {achievement.name}
                          </p>
                          {achievement.unlocked && (
                            <span className="flex-shrink-0 text-[10px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded-full">✓ Done</span>
                          )}
                        </div>
                        <p className={`text-[10px] leading-tight mb-1.5 ${achievement.unlocked ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress value={achievement.progress} className={`h-1.5 flex-1 ${achievement.unlocked ? "" : "opacity-40"}`} />
                          <span className={`text-[10px] font-semibold flex-shrink-0 ${achievement.unlocked ? "text-primary" : "text-muted-foreground"}`}>
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

export default VolunteerDashboard;
