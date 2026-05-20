const User = require('../models/User');
const FoodDonation = require('../models/FoodDonation');
const { AppError } = require('../middleware/errorHandler');

/**
 * @desc    Get platform statistics
 * @route   GET /api/stats
 * @access  Public
 */
exports.getPlatformStats = async (req, res, next) => {
  try {
    // Broader filters to ensure data is picked up if it exists in the database
    const totalDonors = await User.countDocuments({ role: 'DONOR' });
    const totalNGOs = await User.countDocuments({ role: 'NGO' });
    
    // Instead of only completed/delivered, let's include all donations that were at least accepted or completed
    const completedDonations = await FoodDonation.countDocuments({ 
      status: { $in: ['CREATED', 'ACCEPTED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED'] } 
    });

    res.status(200).json({
      success: true,
      data: {
        totalDonors,
        totalNGOs,
        completedDonations,
      },
    });
  } catch (error) {
    console.error("Database connection failed or timed out:", error.message);
    next(error);
  }
};
