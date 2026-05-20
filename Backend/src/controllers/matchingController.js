const geoService = require("../services/geoService");
const pointsService = require("../services/pointsService");
const FoodDonation = require("../models/FoodDonation");
const PickupAssignment = require("../models/PickupAssignment");
const User = require("../models/User");
const { AppError } = require("../middleware/errorHandler");
const notificationService = require("../services/notificationService");

/**
 * @desc    Find nearby NGOs for a donation
 * @route   GET /api/matching/nearby-ngos
 * @access  Private
 */
exports.findNearbyNGOs = async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return next(new AppError("Please provide latitude and longitude", 400));
    }

    const ngos = await geoService.findNearbyNGOs(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : undefined,
    );

    res.status(200).json({
      success: true,
      data: {
        ngos,
        count: ngos.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Find nearby volunteers for a donation
 * @route   GET /api/matching/nearby-volunteers
 * @access  Private
 */
exports.findNearbyVolunteers = async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return next(new AppError("Please provide latitude and longitude", 400));
    }

    const volunteers = await geoService.findNearbyVolunteers(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : undefined,
    );

    res.status(200).json({
      success: true,
      data: {
        volunteers,
        count: volunteers.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Find nearby donations
 * @route   GET /api/matching/nearby-donations
 * @access  Private
 */
exports.findNearbyDonations = async (req, res, next) => {
  try {
    const { lat, lng, radius, status = "CREATED" } = req.query;

    if (!lat || !lng) {
      return next(new AppError("Please provide latitude and longitude", 400));
    }

    const donations = await geoService.findNearbyDonations(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : undefined,
      status,
    );

    res.status(200).json({
      success: true,
      data: {
        donations,
        count: donations.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign volunteer to donation
 * @route   POST /api/matching/assign-volunteer
 * @access  Private/NGO/Admin
 */
exports.assignVolunteer = async (req, res, next) => {
  try {
    const { donationId, volunteerId } = req.body;

    if (!donationId || !volunteerId) {
      return next(
        new AppError("Please provide donation ID and volunteer ID", 400),
      );
    }

    const donation = await FoodDonation.findById(donationId);

    if (!donation) {
      return next(new AppError("Donation not found", 404));
    }

    // Check if NGO accepted this donation or is admin
    if (
      donation.acceptedBy?.toString() !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return next(new AppError("Not authorized to assign volunteer", 403));
    }

    if (donation.status !== "ACCEPTED") {
      return next(
        new AppError(
          "Donation must be accepted before assigning volunteer",
          400,
        ),
      );
    }

    const volunteer = await User.findById(volunteerId);

    if (!volunteer || volunteer.role !== "VOLUNTEER") {
      return next(new AppError("Invalid volunteer", 400));
    }

    // Check if assignment already exists
    let assignment = await PickupAssignment.findOne({ donationId });

    if (assignment) {
      assignment.volunteerId = volunteerId;
      assignment.status = "PENDING";
      await assignment.save();
    } else {
      assignment = await PickupAssignment.create({
        donationId,
        volunteerId,
        status: "PENDING",
      });
    }

    // Update donation
    donation.status = "ASSIGNED";
    donation.assignedVolunteer = volunteerId;
    await donation.save();

    // Send notification to volunteer
    await notificationService.createNotification(
      volunteerId,
      `You have been assigned to pick up a donation: ${donation.foodType}`,
      "VOLUNTEER_ASSIGNED",
      donation._id,
    );

    res.status(200).json({
      success: true,
      data: {
        assignment,
        donation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get assignments for volunteer
 * @route   GET /api/matching/my-assignments
 * @access  Private/Volunteer
 */
exports.getMyAssignments = async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = { volunteerId: req.user.id };
    if (status) query.status = status;

    const assignments = await PickupAssignment.find(query)
      .populate({
        path: "donationId",
        populate: [
          { path: "donorId", select: "name email location phone" },
          { path: "acceptedBy", select: "name email location" },
        ],
      })
      .sort({ assignedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        assignments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update assignment status
 * @route   PUT /api/matching/assignments/:id/status
 * @access  Private/Volunteer
 */
exports.updateAssignmentStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    if (
      !["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status)
    ) {
      return next(new AppError("Invalid status", 400));
    }

    const assignment = await PickupAssignment.findById(req.params.id)
      .populate("donationId")
      .populate("volunteerId", "name");

    if (!assignment) {
      return next(new AppError("Assignment not found", 404));
    }

    // Compare volunteer IDs - handle both populated object and string ID
    const assignmentVolunteerId =
      assignment.volunteerId._id || assignment.volunteerId;
    if (assignmentVolunteerId.toString() !== req.user.id) {
      return next(
        new AppError("Not authorized to update this assignment", 403),
      );
    }

    assignment.status = status;
    if (notes) assignment.notes = notes;

    if (status === "IN_PROGRESS" && !assignment.startedAt) {
      assignment.startedAt = new Date();

      // Update donation status
      if (assignment.donationId) {
        assignment.donationId.status = "IN_TRANSIT";
        await assignment.donationId.save();

        // Send notification to donor and NGO
        await notificationService.createNotification(
          assignment.donationId.donorId,
          `Your donation is on the way! Volunteer ${assignment.volunteerId.name} has picked it up.`,
          "DONATION_IN_TRANSIT",
          assignment.donationId._id,
        );

        await notificationService.createNotification(
          assignment.donationId.acceptedBy,
          `Pickup in progress for: ${assignment.donationId.foodType}`,
          "DONATION_IN_TRANSIT",
          assignment.donationId._id,
        );
      }
    }

    if (status === "COMPLETED") {
      assignment.completedAt = new Date();

      // Update donation status
      if (assignment.donationId) {
        assignment.donationId.status = "DELIVERED";
        await assignment.donationId.save();

        // Send notification to donor and NGO
        await notificationService.createNotification(
          assignment.donationId.donorId,
          `Your donation has been delivered successfully!`,
          "DONATION_DELIVERED",
          assignment.donationId._id,
        );

        await notificationService.createNotification(
          assignment.donationId.acceptedBy,
          `Donation delivery completed: ${assignment.donationId.foodType}`,
          "DONATION_DELIVERED",
          assignment.donationId._id,
        );
      }

      // Award points to volunteer using pointsService
      const pointsEarned = 50;
      await pointsService.awardPoints(
        req.user.id,
        pointsEarned,
        "PICKUP",
        "VOLUNTEER",
        assignment._id,
        "Delivery completed"
      );

      // Send notification to volunteer
      await notificationService.createNotification(
        req.user.id,
        `Delivery completed! You earned ${pointsEarned} points.`,
        "POINTS_EARNED",
        assignment.donationId._id,
      );
    }

    if (status === "CANCELLED") {
      assignment.cancelledAt = new Date();

      // Revert donation status
      if (assignment.donationId) {
        assignment.donationId.status = "ACCEPTED";
        assignment.donationId.assignedVolunteer = null;
        await assignment.donationId.save();

        // Send notification to NGO
        await notificationService.createNotification(
          assignment.donationId.acceptedBy,
          `Volunteer cancelled the pickup for: ${assignment.donationId.foodType}`,
          "DONATION_PICKUP_CANCELLED",
          assignment.donationId._id,
        );
      }
    }

    await assignment.save();

    res.status(200).json({
      success: true,
      data: {
        assignment,
        pointsEarned: status === "COMPLETED" ? 50 : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get donations available for pickup
 * @route   GET /api/matching/available-for-pickup
 * @access  Private/Volunteer
 */
exports.getAvailableForPickup = async (req, res, next) => {
  try {
    const acceptedDonations = await FoodDonation.find({
      status: "ACCEPTED",
      acceptedBy: { $ne: null },
    })
      .populate("donorId", "name email phone location address")
      .populate("acceptedBy", "name email location address")
      .sort({ createdAt: -1 });

    const availableDonations = [];

    for (const donation of acceptedDonations) {
      const existingAssignment = await PickupAssignment.findOne({
        donationId: donation._id,
        status: { $in: ["PENDING", "IN_PROGRESS"] },
      });

      if (!existingAssignment) {
        availableDonations.push(donation);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        donations: availableDonations,
        count: availableDonations.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Volunteer accepts a task
 * @route   POST /api/matching/accept-task/:donationId
 * @access  Private/Volunteer
 */
exports.volunteerAcceptTask = async (req, res, next) => {
  try {
    const { donationId } = req.params;
    const volunteerId = req.user.id;

    const donation = await FoodDonation.findById(donationId)
      .populate("donorId", "name email phone location address")
      .populate("acceptedBy", "name email location address");

    if (!donation) {
      return next(new AppError("Donation not found", 404));
    }

    if (donation.status !== "ACCEPTED") {
      return next(
        new AppError("This donation is not available for pickup", 400),
      );
    }

    // Check if already assigned
    const existingAssignment = await PickupAssignment.findOne({
      donationId,
      status: { $in: ["PENDING", "IN_PROGRESS"] },
    });

    if (existingAssignment) {
      return next(new AppError("This task has already been accepted", 400));
    }

    // Check if volunteer already has active task
    const volunteerActiveTask = await PickupAssignment.findOne({
      volunteerId,
      status: { $in: ["PENDING", "IN_PROGRESS"] },
    });

    if (volunteerActiveTask) {
      return next(new AppError("You already have an active delivery", 400));
    }

    // Create assignment
    const assignment = await PickupAssignment.create({
      donationId,
      volunteerId,
      status: "PENDING",
      assignedAt: new Date(),
    });

    // Update donation
    donation.status = "ASSIGNED";
    donation.assignedVolunteer = volunteerId;
    await donation.save();

    // Send notification to donor
    await notificationService.createNotification(
      donation.donorId._id,
      `A volunteer has accepted your donation: ${donation.foodType}`,
      "VOLUNTEER_ASSIGNED",
      donation._id,
    );

    // Send notification to NGO
    await notificationService.createNotification(
      donation.acceptedBy._id,
      `Volunteer ${req.user.name} has accepted pickup for: ${donation.foodType}`,
      "VOLUNTEER_ASSIGNED",
      donation._id,
    );

    const populatedAssignment = await PickupAssignment.findById(assignment._id)
      .populate({
        path: "donationId",
        populate: [
          { path: "donorId", select: "name email phone location address" },
          { path: "acceptedBy", select: "name email location address" },
        ],
      })
      .populate("volunteerId", "name email phone");

    res.status(201).json({
      success: true,
      message: "Task accepted successfully",
      data: { assignment: populatedAssignment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Complete assignment (convenience method)
 * @route   POST /api/matching/assignments/:id/complete
 * @access  Private/Volunteer
 */
exports.completeAssignment = async (req, res, next) => {
  try {
    const { notes } = req.body;

    const assignment = await PickupAssignment.findById(req.params.id)
      .populate("donationId")
      .populate("volunteerId", "name");

    if (!assignment) {
      return next(new AppError("Assignment not found", 404));
    }

    // Compare volunteer IDs - handle both populated object and string ID
    const assignmentVolunteerId =
      assignment.volunteerId._id || assignment.volunteerId;
    if (assignmentVolunteerId.toString() !== req.user.id) {
      return next(
        new AppError("Not authorized to update this assignment", 403),
      );
    }

    assignment.status = "COMPLETED";
    assignment.completedAt = new Date();
    if (notes) assignment.notes = notes;

    // Update donation status
    if (assignment.donationId) {
      assignment.donationId.status = "DELIVERED";
      await assignment.donationId.save();

      // Send notification to donor and NGO
      await notificationService.createNotification(
        assignment.donationId.donorId,
        `Your donation has been delivered successfully!`,
        "DONATION_DELIVERED",
        assignment.donationId._id,
      );

      await notificationService.createNotification(
        assignment.donationId.acceptedBy,
        `Donation delivery completed: ${assignment.donationId.foodType}`,
        "DONATION_DELIVERED",
        assignment.donationId._id,
      );
    }

    // Award points to volunteer using pointsService
    const pointsEarned = 50;
    await pointsService.awardPoints(
      req.user.id,
      pointsEarned,
      "PICKUP",
      "VOLUNTEER",
      assignment._id,
      "Delivery completed",
    );

    // Send notification to volunteer
    await notificationService.createNotification(
      req.user.id,
      `Delivery completed! You earned ${pointsEarned} points.`,
      "POINTS_EARNED",
      assignment.donationId._id,
    );

    await assignment.save();

    res.status(200).json({
      success: true,
      message: "Assignment completed successfully",
      data: {
        assignment,
        pointsEarned,
      },
    });
  } catch (error) {
    next(error);
  }
};
