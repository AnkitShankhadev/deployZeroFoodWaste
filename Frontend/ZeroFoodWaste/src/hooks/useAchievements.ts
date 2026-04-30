import { useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  /** Progress value between 0–100 for the progress bar */
  progress: number;
  /** Human-readable progress label e.g. "3 / 10" */
  progressLabel: string;
}

export interface AchievementStats {
  completed: number;
  active: number;
  totalQuantity: number;
  total: number;
}

/** Build the achievements array from live donor stats. */
export function buildDonorAchievements(stats: AchievementStats): Achievement[] {
  return [
    {
      id: "first_donation",
      name: "First Donation",
      description: "Complete your very first food donation.",
      emoji: "⭐",
      unlocked: stats.completed >= 1,
      progress: Math.min(100, stats.completed >= 1 ? 100 : 0),
      progressLabel: `${Math.min(stats.completed, 1)} / 1`,
    },
    {
      id: "five_donations",
      name: "Generous Giver",
      description: "Complete 5 food donations.",
      emoji: "🥗",
      unlocked: stats.completed >= 5,
      progress: Math.min(100, (stats.completed / 5) * 100),
      progressLabel: `${Math.min(stats.completed, 5)} / 5`,
    },
    {
      id: "ten_donations",
      name: "10 Donations",
      description: "Reach 10 completed donations.",
      emoji: "🏆",
      unlocked: stats.completed >= 10,
      progress: Math.min(100, (stats.completed / 10) * 100),
      progressLabel: `${Math.min(stats.completed, 10)} / 10`,
    },
    {
      id: "active_donor",
      name: "Active Donor",
      description: "Keep 3 or more donations active at once.",
      emoji: "⚡",
      unlocked: stats.active >= 3,
      progress: Math.min(100, (stats.active / 3) * 100),
      progressLabel: `${Math.min(stats.active, 3)} / 3`,
    },
    {
      id: "impact_hero",
      name: "Impact Hero",
      description: "Donate a total of 100 kg of food.",
      emoji: "🌿",
      unlocked: stats.totalQuantity >= 100,
      progress: Math.min(100, (stats.totalQuantity / 100) * 100),
      progressLabel: `${Math.min(Math.round(stats.totalQuantity), 100)} / 100 kg`,
    },
    {
      id: "community_champion",
      name: "Community Champion",
      description: "Complete 25 donations.",
      emoji: "🌟",
      unlocked: stats.completed >= 25,
      progress: Math.min(100, (stats.completed / 25) * 100),
      progressLabel: `${Math.min(stats.completed, 25)} / 25`,
    },
  ];
}

export interface NGOAchievementStats {
  collectedKg: number;
  activePickups: number;
  completedCount: number;
  peopleFed: number;
}

/** Build the achievements array from live NGO stats. */
export function buildNGOAchievements(stats: NGOAchievementStats): Achievement[] {
  return [
    {
      id: "ngo_first_collection",
      name: "First Collection",
      description: "Accept and complete your first food collection.",
      emoji: "📦",
      unlocked: stats.completedCount >= 1,
      progress: Math.min(100, stats.completedCount >= 1 ? 100 : 0),
      progressLabel: `${Math.min(stats.completedCount, 1)} / 1`,
    },
    {
      id: "ngo_five_collections",
      name: "Steady Collector",
      description: "Complete 5 food collections.",
      emoji: "🚚",
      unlocked: stats.completedCount >= 5,
      progress: Math.min(100, (stats.completedCount / 5) * 100),
      progressLabel: `${Math.min(stats.completedCount, 5)} / 5`,
    },
    {
      id: "ngo_50kg",
      name: "50 kg Collected",
      description: "Collect a total of 50 kg of food.",
      emoji: "⚖️",
      unlocked: stats.collectedKg >= 50,
      progress: Math.min(100, (stats.collectedKg / 50) * 100),
      progressLabel: `${Math.min(Math.round(stats.collectedKg), 50)} / 50 kg`,
    },
    {
      id: "ngo_100_people",
      name: "Feeding 100",
      description: "Help feed an estimated 100 people.",
      emoji: "🍽️",
      unlocked: stats.peopleFed >= 100,
      progress: Math.min(100, (stats.peopleFed / 100) * 100),
      progressLabel: `${Math.min(Math.round(stats.peopleFed), 100)} / 100`,
    },
    {
      id: "ngo_multitasker",
      name: "Multitasker",
      description: "Have 3 or more active pickups at once.",
      emoji: "⚡",
      unlocked: stats.activePickups >= 3,
      progress: Math.min(100, (stats.activePickups / 3) * 100),
      progressLabel: `${Math.min(stats.activePickups, 3)} / 3`,
    },
    {
      id: "ngo_community_pillar",
      name: "Community Pillar",
      description: "Complete 20 collections.",
      emoji: "🏛️",
      unlocked: stats.completedCount >= 20,
      progress: Math.min(100, (stats.completedCount / 20) * 100),
      progressLabel: `${Math.min(stats.completedCount, 20)} / 20`,
    },
  ];
}

export interface VolunteerAchievementStats {
  totalDeliveries: number;
  deliveriesToday: number;
  totalPoints: number;
}

/** Build the achievements array from live volunteer stats. */
export function buildVolunteerAchievements(stats: VolunteerAchievementStats): Achievement[] {
  return [
    {
      id: "vol_first_delivery",
      name: "First Delivery",
      description: "Complete your very first delivery.",
      emoji: "🚴",
      unlocked: stats.totalDeliveries >= 1,
      progress: Math.min(100, stats.totalDeliveries >= 1 ? 100 : 0),
      progressLabel: `${Math.min(stats.totalDeliveries, 1)} / 1`,
    },
    {
      id: "vol_five_deliveries",
      name: "Reliable Runner",
      description: "Complete 5 deliveries.",
      emoji: "🏃",
      unlocked: stats.totalDeliveries >= 5,
      progress: Math.min(100, (stats.totalDeliveries / 5) * 100),
      progressLabel: `${Math.min(stats.totalDeliveries, 5)} / 5`,
    },
    {
      id: "vol_daily_goal",
      name: "Daily Champion",
      description: "Hit your daily goal of 5 deliveries in a day.",
      emoji: "🎯",
      unlocked: stats.deliveriesToday >= 5,
      progress: Math.min(100, (stats.deliveriesToday / 5) * 100),
      progressLabel: `${Math.min(stats.deliveriesToday, 5)} / 5`,
    },
    {
      id: "vol_twenty_deliveries",
      name: "Road Warrior",
      description: "Complete 20 total deliveries.",
      emoji: "🛣️",
      unlocked: stats.totalDeliveries >= 20,
      progress: Math.min(100, (stats.totalDeliveries / 20) * 100),
      progressLabel: `${Math.min(stats.totalDeliveries, 20)} / 20`,
    },
    {
      id: "vol_500_points",
      name: "500 Points Club",
      description: "Earn 500 impact points.",
      emoji: "💎",
      unlocked: stats.totalPoints >= 500,
      progress: Math.min(100, (stats.totalPoints / 500) * 100),
      progressLabel: `${Math.min(stats.totalPoints, 500)} / 500`,
    },
    {
      id: "vol_fifty_deliveries",
      name: "Delivery Legend",
      description: "Complete 50 total deliveries.",
      emoji: "🌟",
      unlocked: stats.totalDeliveries >= 50,
      progress: Math.min(100, (stats.totalDeliveries / 50) * 100),
      progressLabel: `${Math.min(stats.totalDeliveries, 50)} / 50`,
    },
  ];
}

const ACHIEVEMENT_STORAGE_KEY = "zfw_notified_achievements";

function getNotifiedSet(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${ACHIEVEMENT_STORAGE_KEY}_${userId}`);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function saveNotifiedSet(userId: string, set: Set<string>) {
  try {
    localStorage.setItem(
      `${ACHIEVEMENT_STORAGE_KEY}_${userId}`,
      JSON.stringify([...set])
    );
  } catch {
    // localStorage unavailable — silent fail
  }
}

/**
 * Watches the achievements list and fires toast notifications whenever a new
 * achievement is unlocked for the first time (tracked per user via localStorage).
 */
export function useAchievementNotifications(
  achievements: Achievement[],
  userId: string | undefined
) {
  // Track the last notified state without re-running the effect on every render
  const notifiedRef = useRef<Set<string>>(new Set());
  const initialised = useRef(false);

  useEffect(() => {
    if (!userId) return;

    // On first mount, load what's already been notified so we don't re-fire
    if (!initialised.current) {
      notifiedRef.current = getNotifiedSet(userId);
      initialised.current = true;

      // Silently mark any already-unlocked achievements as notified
      // (they were achieved before this feature existed)
      achievements.forEach((a) => {
        if (a.unlocked && !notifiedRef.current.has(a.id)) {
          notifiedRef.current.add(a.id);
        }
      });
      saveNotifiedSet(userId, notifiedRef.current);
      return;
    }

    // Check for newly unlocked achievements
    achievements.forEach((achievement) => {
      if (achievement.unlocked && !notifiedRef.current.has(achievement.id)) {
        notifiedRef.current.add(achievement.id);
        saveNotifiedSet(userId, notifiedRef.current);

        // Fire a toast notification
        toast({
          title: `${achievement.emoji} Achievement Unlocked!`,
          description: `"${achievement.name}" — ${achievement.description}`,
        });
      }
    });
  }, [achievements, userId]);
}
