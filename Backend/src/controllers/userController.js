const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/:id
 * @access  Private
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { name, phone, location, profileImage } = req.body;
    const userId = req.params.id;

    // Check if user can update (own profile or admin)
    if (userId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(new AppError('Not authorized to update this profile', 403));
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;
    if (profileImage) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user status (Admin only)
 * @route   PUT /api/users/:id/status
 * @access  Private/Admin
 */
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['ACTIVE', 'BANNED', 'INACTIVE'].includes(status)) {
      return next(new AppError('Invalid status', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get NGO + Volunteer map pins (public, no auth)
 * @route   GET /api/users/map-pins
 * @access  Public
 */
exports.getMapPins = async (req, res, next) => {
  try {
    const users = await User.find({
      role: { $in: ['NGO', 'VOLUNTEER'] },
      status: 'ACTIVE',
      'location.lat': { $exists: true },
      'location.lng': { $exists: true },
    })
      .select('name role location description phone profileImage')
      .lean();

    const pins = users.map((u) => ({
      id: u._id,
      type: u.role === 'NGO' ? 'ngo' : 'volunteer',
      title: u.name,
      latitude: u.location.lat,
      longitude: u.location.lng,
      address: u.location.address || null,
      description: u.description || null,
      phone: u.phone || null,
      profileImage: u.profileImage || null,
    }));

    res.status(200).json({
      success: true,
      data: { pins, total: pins.length },
    });
  } catch (error) {
    next(error);
  }
};

