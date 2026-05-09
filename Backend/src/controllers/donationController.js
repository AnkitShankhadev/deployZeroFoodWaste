const FoodDonation = require("../models/FoodDonation");
const PickupAssignment = require("../models/PickupAssignment");
const { AppError } = require("../middleware/errorHandler");
const pointsService = require("../services/pointsService");
const notificationService = require("../services/notificationService");

/**
 * @desc    Create a food donation
 * @route   POST /api/donations
 * @access  Private/Donor
 */
exports.createDonation = async (req, res, next) => {
  try {
    const { foodType, quantity, expiryDate, description, location, images } =
      req.body;

    // Validation
    if (!foodType || !quantity || !expiryDate || !location) {
      return next(new AppError("Please provide all required fields", 400));
    }

    // Check expiry date
    if (new Date(expiryDate) <= new Date()) {
      return next(new AppError("Expiry date must be in the future", 400));
    }

    const donation = await FoodDonation.create({
      donorId: req.user.id,
      foodType,
      quantity,
      expiryDate,
      description,
      location,
      images: images || [],
    });

    res.status(201).json({
      success: true,
      data: {
        donation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all donations
 * @route   GET /api/donations
 * @access  Private
 */
exports.getAllDonations = async (req, res, next) => {
  try {
    const { status, donorId, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (donorId) query.donorId = donorId;

    const donations = await FoodDonation.find(query)
      .populate("donorId", "name email location profileImage")
      .populate("acceptedBy", "name email")
      .populate("assignedVolunteer", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await FoodDonation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        donations,
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
 * @desc    Get donation by ID
 * @route   GET /api/donations/:id
 * @access  Private
 */
exports.getDonation = async (req, res, next) => {
  try {
    const donation = await FoodDonation.findById(req.params.id)
      .populate("donorId", "name email location phone profileImage")
      .populate("acceptedBy", "name email location")
      .populate("assignedVolunteer", "name email location");

    if (!donation) {
      return next(new AppError("Donation not found", 404));
    }

    res.status(200).json({
      success: true,
      data: {
        donation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update donation
 * @route   PUT /api/donations/:id
 * @access  Private/Donor
 */
exports.updateDonation = async (req, res, next) => {
  try {
    const { foodType, quantity, expiryDate, description, location, images } =
      req.body;

    const donation = await FoodDonation.findById(req.params.id);

    if (!donation) {
      return next(new AppError("Donation not found", 404));
    }

    // Check if user is the donor or admin
    if (
      donation.donorId.toString() !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return next(new AppError("Not authorized to update this donation", 403));
    }

    // Can't update if already accepted or completed
    if (["ACCEPTED", "ASSIGNED", "COMPLETED"].includes(donation.status)) {
      return next(
        new AppError("Cannot update donation in current status", 400),
      );
    }

    const updateData = {};
    if (foodType) updateData.foodType = foodType;
    if (quantity) updateData.quantity = quantity;
    if (expiryDate) updateData.expiryDate = expiryDate;
    if (description !== undefined) updateData.description = description;
    if (location) updateData.location = location;
    if (images) updateData.images = images;

    const updatedDonation = await FoodDonation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      data: {
        donation: updatedDonation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept donation (NGO)
 * @route   PUT /api/donations/:id/accept
 * @access  Private/NGO
 */
exports.acceptDonation = async (req, res, next) => {
  try {
    const donation = await FoodDonation.findById(req.params.id);

    if (!donation) {
      return next(new AppError("Donation not found", 404));
    }

    if (donation.status !== "CREATED") {
      return next(
        new AppError("Donation is not available for acceptance", 400),
      );
    }

    donation.status = "ACCEPTED";
    donation.acceptedBy = req.user.id;
    await donation.save();

    // Award points to donor for creating donation
    await pointsService.awardPoints(
      donation.donorId,
      pointsService.calculatePoints("DONATION", "DONOR"),
      "DONATION",
      "DONOR",
      donation._id,
      "Donation created",
    );

    // Award points to NGO for accepting donation
    await pointsService.awardPoints(
      req.user.id,
      pointsService.calculatePoints("DONATION", "NGO"),
      "DONATION",
      "NGO",
      donation._id,
      "Donation accepted",
    );

    // Send notification to donor
    await notificationService.createNotification(
      donation.donorId,
      `Your donation has been accepted by ${req.user.name}`,
      "DONATION_ACCEPTED",
      donation._id,
    );

    res.status(200).json({
      success: true,
      data: {
        donation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Complete donation
 * @route   PUT /api/donations/:id/complete
 * @access  Private
 */
exports.completeDonation = async (req, res, next) => {
  try {
    const donation = await FoodDonation.findById(req.params.id);

    if (!donation) {
      return next(new AppError("Donation not found", 404));
    }

    // Check authorization
    const isDonor = donation.donorId.toString() === req.user.id;
    const isVolunteer =
      donation.assignedVolunteer &&
      donation.assignedVolunteer.toString() === req.user.id;
    const isAdmin = req.user.role === "ADMIN";

    if (!isDonor && !isVolunteer && !isAdmin) {
      return next(
        new AppError("Not authorized to complete this donation", 403),
      );
    }

    if (donation.status === "COMPLETED") {
      return next(new AppError("Donation already completed", 400));
    }

    donation.status = "COMPLETED";
    donation.completedAt = new Date();
    await donation.save();

    // Award completion points
    if (isDonor) {
      await pointsService.awardPoints(
        donation.donorId,
        pointsService.calculatePoints("COMPLETION", "DONOR"),
        "DONATION",
        "DONOR",
        donation._id,
        "Donation completed",
      );
      await pointsService.checkAchievements(donation.donorId, "DONOR");
    }

    if (donation.assignedVolunteer) {
      await pointsService.awardPoints(
        donation.assignedVolunteer,
        pointsService.calculatePoints("COMPLETION", "VOLUNTEER"),
        "PICKUP",
        "VOLUNTEER",
        donation._id,
        "Pickup completed",
      );
      await pointsService.checkAchievements(
        donation.assignedVolunteer,
        "VOLUNTEER",
      );
    }

    // Update pickup assignment if exists
    const assignment = await PickupAssignment.findOne({
      donationId: donation._id,
    });
    if (assignment) {
      assignment.status = "COMPLETED";
      assignment.completedAt = new Date();
      await assignment.save();
    }

    // Send notifications
    await notificationService.createNotification(
      donation.donorId,
      "Your donation has been completed successfully!",
      "DONATION_COMPLETED",
      donation._id,
    );

    res.status(200).json({
      success: true,
      data: {
        donation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel donation
 * @route   PUT /api/donations/:id/cancel
 * @access  Private
 */
exports.cancelDonation = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const donation = await FoodDonation.findById(req.params.id);

    if (!donation) {
      return next(new AppError("Donation not found", 404));
    }

    // Check authorization
    const isDonor = donation.donorId.toString() === req.user.id;
    const isAdmin = req.user.role === "ADMIN";

    if (!isDonor && !isAdmin) {
      return next(new AppError("Not authorized to cancel this donation", 403));
    }

    if (["COMPLETED", "CANCELLED"].includes(donation.status)) {
      return next(
        new AppError("Cannot cancel donation in current status", 400),
      );
    }

    donation.status = "CANCELLED";
    donation.cancelledAt = new Date();
    donation.cancellationReason = reason || "No reason provided";
    await donation.save();

    // Cancel pickup assignment if exists
    const assignment = await PickupAssignment.findOne({
      donationId: donation._id,
    });
    if (assignment) {
      assignment.status = "CANCELLED";
      assignment.cancelledAt = new Date();
      assignment.cancellationReason = reason || "Donation cancelled";
      await assignment.save();
    }

    res.status(200).json({
      success: true,
      data: {
        donation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete donation
 * @route   DELETE /api/donations/:id
 * @access  Private/Donor/Admin
 */
exports.deleteDonation = async (req, res, next) => {
  try {
    const donation = await FoodDonation.findById(req.params.id);

    if (!donation) {
      return next(new AppError("Donation not found", 404));
    }

    // Check authorization
    const isDonor = donation.donorId.toString() === req.user.id;
    const isAdmin = req.user.role === "ADMIN";

    if (!isDonor && !isAdmin) {
      return next(new AppError("Not authorized to delete this donation", 403));
    }

    // Can only delete if not accepted or completed
    if (["ACCEPTED", "ASSIGNED", "COMPLETED"].includes(donation.status)) {
      return next(
        new AppError("Cannot delete donation in current status", 400),
      );
    }

    await FoodDonation.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Donation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
/**
 * @desc    Get all donation locations for the map (public)
 * @route   GET /api/donations/locations
 * @access  Public
 */
exports.getDonationLocations = async (req, res, next) => {
  try {
    const donations = await FoodDonation.find({
      status: { $in: ["CREATED", "ACCEPTED", "ASSIGNED"] },
      "location.lat": { $exists: true },
      "location.lng": { $exists: true },
    })
      .select("foodType quantity quantityUnit expiryDate description status location donorId")
      .populate("donorId", "name profileImage phone")
      .lean();

    const locations = donations.map((d) => ({
      id: d._id,
      foodType: d.foodType,
      quantity: d.quantity,
      quantityUnit: d.quantityUnit,
      expiryDate: d.expiryDate,
      description: d.description,
      status: d.status,
      latitude: d.location.lat,
      longitude: d.location.lng,
      address: d.location.address,
      donor: d.donorId ? { name: d.donorId.name, phone: d.donorId.phone, profileImage: d.donorId.profileImage } : null,
    }));

    res.status(200).json({
      success: true,
      data: { locations, total: locations.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clean up expired donations (mark as EXPIRED)
 * @route   POST /api/donations/cleanup/expired
 * @access  Private/Admin
 */
exports.cleanupExpiredDonations = async (req, res, next) => {
  try {
    const now = new Date();

    // Find donations that are expired
    const expiredDonations = await FoodDonation.find({
      expiryDate: { $lt: now },
      status: { $nin: ["DELIVERED", "CANCELLED", "EXPIRED"] },
    }).populate("donorId", "name email _id");

    if (expiredDonations.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No expired donations found",
        data: {
          cleaned: 0,
        },
      });
    }

    // Mark each expired donation as EXPIRED
    const cleanedCount = await FoodDonation.updateMany(
      {
        expiryDate: { $lt: now },
        status: { $nin: ["DELIVERED", "CANCELLED", "EXPIRED"] },
      },
      { status: "EXPIRED" },
    );

    // Send notifications to donors
    for (const donation of expiredDonations) {
      await notificationService.createNotification(
        donation.donorId._id,
        `Your donation of ${donation.foodType} has expired and been removed from availability.`,
        "SYSTEM",
        donation._id,
      );
    }

    res.status(200).json({
      success: true,
      message: `Successfully marked ${cleanedCount.modifiedCount} donation(s) as expired`,
      data: {
        cleaned: cleanedCount.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
