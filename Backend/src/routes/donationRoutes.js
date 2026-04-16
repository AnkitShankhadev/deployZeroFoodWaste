const express = require("express");
const router = express.Router();
const {
  createDonation,
  getAllDonations,
  getDonation,
  updateDonation,
  acceptDonation,
  completeDonation,
  cancelDonation,
  deleteDonation,
  cleanupExpiredDonations,
  getDonationLocations,
} = require("../controllers/donationController");
const { protect } = require("../middleware/authMiddleware");
const {
  donorOnly,
  ngoOnly,
  authorize,
} = require("../middleware/roleMiddleware");

// Public route (no auth required) - must be BEFORE protect middleware
router.get("/locations", getDonationLocations);

router.use(protect); // All routes below require authentication

router.post("/cleanup/expired", authorize("ADMIN"), cleanupExpiredDonations);
router.post("/", donorOnly, createDonation);
router.get("/", getAllDonations);
router.get("/:id", getDonation);
router.put("/:id", authorize("DONOR", "ADMIN"), updateDonation);
router.put("/:id/accept", ngoOnly, acceptDonation);
router.put(
  "/:id/complete",
  authorize("DONOR", "VOLUNTEER", "ADMIN"),
  completeDonation,
);
router.put("/:id/cancel", authorize("DONOR", "ADMIN"), cancelDonation);
router.delete("/:id", authorize("DONOR", "ADMIN"), deleteDonation);

module.exports = router;
