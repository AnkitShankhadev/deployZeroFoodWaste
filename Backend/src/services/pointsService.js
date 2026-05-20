const Points = require("../models/Points");
const User = require("../models/User");
const Leaderboard = require("../models/Leaderboard");
const Achievement = require("../models/Achievement");
const Badge = require("../models/Badge");
const notificationService = require("./notificationService");
const { DONOR_ACHIEVEMENTS, NGO_ACHIEVEMENTS, VOLUNTEER_ACHIEVEMENTS } = require("../config/achievements");
const FoodDonation = require("../models/FoodDonation");
const PickupAssignment = require("../models/PickupAssignment");

/**
 * Award points to a user
 * @param {string} userId - User ID
 * @param {number} points - Points to award
 * @param {string} source - Source of points (DONATION, PICKUP, ACHIEVEMENT, BADGE, ADMIN_ADJUSTMENT)
 * @param {string} role - User role
 * @param {string} sourceId - ID of the source (donation, pickup, etc.)
 * @param {string} description - Description of points
 * @returns {Promise<Object>} Points record
 */
const awardPoints = async (
  userId,
  points,
  source,
  role,
  sourceId = null,
  description = "",
) => {
  try {
    // Check if points already awarded for this source
    if (sourceId) {
      const existingPoints = await Points.findOne({
        userId,
        source,
        sourceId,
      });

      if (existingPoints) {
        return existingPoints; // Prevent duplicate points
      }
    }

    // Create points record
    const pointsRecord = await Points.create({
      userId,
      points,
      source,
      sourceId,
      description,
      role,
    });

    // Update user's total points
    await User.findByIdAndUpdate(userId, {
      $inc: { totalPoints: points },
    });

    // Update leaderboard
    await updateLeaderboard(userId, role);

    // Send notification
    await notificationService.createNotification(
      userId,
      `You earned ${points} points! ${description}`,
      "POINTS_EARNED",
      sourceId,
    );

    return pointsRecord;
  } catch (error) {
    throw new Error(`Error awarding points: ${error.message}`);
  }
};

/**
 * Calculate points based on action and role
 * @param {string} action - Action type (DONATION, PICKUP, etc.)
 * @param {string} role - User role
 * @param {object} metadata - Additional metadata
 * @returns {number} Points to award
 */
const calculatePoints = (action, role, metadata = {}) => {
  const pointValues = {
    DONATION: {
      DONOR: 10,
      DEFAULT: 5,
    },
    PICKUP: {
      VOLUNTEER: 15,
      DEFAULT: 10,
    },
    COMPLETION: {
      DONOR: 20,
      VOLUNTEER: 25,
      NGO: 15,
      DEFAULT: 10,
    },
    STREAK: {
      DEFAULT: 5, // Per day
    },
    MILESTONE: {
      DEFAULT: 50,
    },
  };

  const actionPoints = pointValues[action] || {};
  return actionPoints[role] || actionPoints.DEFAULT || 0;
};

/**
 * Update leaderboard for a user
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {Promise<void>}
 */
const updateLeaderboard = async (userId, role) => {
  try {
    const user = await User.findById(userId);
    if (!user || !["DONOR", "NGO", "VOLUNTEER"].includes(role)) {
      return;
    }

    // Get user stats
    const donationsCount = await Points.countDocuments({
      userId,
      source: "DONATION",
    });
    const pickupsCount = await Points.countDocuments({
      userId,
      source: "PICKUP",
    });
    const achievementsCount = await Achievement.countDocuments({ userId });
    const badgesCount = await Badge.countDocuments({ userId });

    // Prepare update data based on role
    const updateData = {
      userId,
      role,
      totalPoints: user.totalPoints,
      achievementsCount,
      badgesCount,
      lastUpdated: new Date(),
    };

    // Set role-specific counts
    if (role === "DONOR") {
      updateData.donationsCount = donationsCount;
      updateData.collectionsCount = 0;
      updateData.pickupsCount = 0;
    } else if (role === "NGO") {
      updateData.donationsCount = 0;
      updateData.collectionsCount = pickupsCount; // NGOs collect donations
      updateData.pickupsCount = 0;
    } else if (role === "VOLUNTEER") {
      updateData.donationsCount = 0;
      updateData.collectionsCount = 0;
      updateData.pickupsCount = pickupsCount;
    }

    // Update or create leaderboard entry
    await Leaderboard.findOneAndUpdate({ userId }, updateData, {
      upsert: true,
      new: true,
    });

    // Recalculate ranks for this role
    await recalculateRanks(role);
  } catch (error) {
    throw new Error(`Error updating leaderboard: ${error.message}`);
  }
};

/**
 * Recalculate ranks for a specific role
 * @param {string} role - User role
 * @returns {Promise<void>}
 */
const recalculateRanks = async (role) => {
  try {
    const leaderboard = await Leaderboard.find({ role })
      .sort({ totalPoints: -1 })
      .select("userId");

    // Update ranks
    for (let i = 0; i < leaderboard.length; i++) {
      await Leaderboard.findOneAndUpdate(
        { userId: leaderboard[i].userId },
        { rank: i + 1 },
      );
    }
  } catch (error) {
    throw new Error(`Error recalculating ranks: ${error.message}`);
  }
};

/**
 * Check and award achievements
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {Promise<void>}
 */
const checkAchievements = async (userId, role) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    
    let potentialAchievements = [];
    
    if (role === 'DONOR') {
      potentialAchievements = DONOR_ACHIEVEMENTS;
    } else if (role === 'NGO') {
      potentialAchievements = NGO_ACHIEVEMENTS;
    } else if (role === 'VOLUNTEER') {
      potentialAchievements = VOLUNTEER_ACHIEVEMENTS;
    }

    // Pre-calculate some common stats to save DB calls
    const donationsCount = await Points.countDocuments({ userId, source: "DONATION" });
    const pickupsCount = await Points.countDocuments({ userId, source: "PICKUP" });
    const collectionsCount = await Points.countDocuments({ userId, source: "DONATION", role: "NGO" });

    for (const achievementDef of potentialAchievements) {
      // Check if user already has this achievement
      const existingAchievement = await Achievement.findOne({
        userId,
        "metadata.achievementId": achievementDef.id
      });

      if (existingAchievement) continue;

      let achieved = false;

      // Check trigger conditions
      switch (achievementDef.trigger) {
        case "DONATION_COUNT":
          achieved = donationsCount >= achievementDef.targetValue;
          break;
        case "PICKUP_COUNT":
          achieved = pickupsCount >= achievementDef.targetValue;
          break;
        case "COLLECTION_COUNT":
          achieved = collectionsCount >= achievementDef.targetValue;
          break;
        case "TOTAL_QUANTITY":
          if (role === 'DONOR') {
            const donations = await FoodDonation.find({ donorId: userId, status: { $in: ["DELIVERED", "COMPLETED", "ACCEPTED", "ASSIGNED"] } });
            let total = 0;
            donations.forEach(d => { total += (parseFloat(d.quantity) || 0); });
            achieved = total >= achievementDef.targetValue;
          } else if (role === 'VOLUNTEER') {
             const assignments = await PickupAssignment.find({ volunteerId: userId, status: "COMPLETED" }).populate('donationId');
             let total = 0;
             assignments.forEach(a => {
                if (a.donationId && a.donationId.quantity) {
                   total += (parseFloat(a.donationId.quantity) || 0);
                }
             });
             achieved = total >= achievementDef.targetValue;
          } else if (role === 'NGO') {
             const donations = await FoodDonation.find({ acceptedBy: userId, status: { $in: ["DELIVERED", "COMPLETED"] } });
             let total = 0;
             donations.forEach(d => { total += (parseFloat(d.quantity) || 0); });
             achieved = total >= achievementDef.targetValue;
          }
          break;
        case "FOOD_TYPE_VARIETY":
          if (role === 'DONOR') {
            const distinctTypes = await FoodDonation.distinct("foodType", { donorId: userId });
            achieved = distinctTypes.length >= achievementDef.targetValue;
          }
          break;
        case "CONSECUTIVE_DAYS":
          const points = await Points.find({ userId }).sort({ earnedAt: 1 }).select('earnedAt');
          if (points.length > 0) {
            let maxStreak = 1;
            let currentStreak = 1;
            let lastDate = new Date(points[0].earnedAt).setHours(0,0,0,0);
            for (let i = 1; i < points.length; i++) {
               const currentDate = new Date(points[i].earnedAt).setHours(0,0,0,0);
               const diffTime = Math.abs(currentDate - lastDate);
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
               if (diffDays === 1) {
                  currentStreak++;
                  maxStreak = Math.max(maxStreak, currentStreak);
               } else if (diffDays > 1) {
                  currentStreak = 1;
               }
               lastDate = currentDate;
            }
            achieved = maxStreak >= achievementDef.targetValue;
          }
          break;
        case "RESPONSE_TIME":
          achieved = collectionsCount >= 10;
          break;
        case "DELIVERY_TIME":
        case "ON_TIME_DELIVERIES":
           achieved = pickupsCount >= achievementDef.targetValue;
           break;
        default:
          break;
      }

      if (achieved) {
        // Award achievement
        const newAchievement = await Achievement.create({
          userId,
          type: achievementDef.type,
          title: achievementDef.title,
          description: achievementDef.description,
          pointsAwarded: achievementDef.pointsAwarded,
          metadata: {
            achievementId: achievementDef.id,
            targetValue: achievementDef.targetValue,
          },
        });

        // Award points for achievement
        await module.exports.awardPoints(
          userId,
          achievementDef.pointsAwarded,
          "ACHIEVEMENT",
          role,
          newAchievement._id,
          `Achievement unlocked: ${achievementDef.title}`
        );

        // Send notification
        await notificationService.createNotification(
          userId,
          `Achievement unlocked: ${achievementDef.title}!`,
          "BADGE_EARNED"
        );
      }
    }
  } catch (error) {
    console.error("Error checking achievements:", error.message);
  }
};

module.exports = {
  awardPoints,
  calculatePoints,
  updateLeaderboard,
  recalculateRanks,
  checkAchievements,
};
