const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getMapPins,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly, authorize } = require('../middleware/roleMiddleware');

// Public route — must be BEFORE protect middleware
router.get('/map-pins', getMapPins);

router.use(protect); // All routes below require authentication

router.get('/', adminOnly, getAllUsers);
router.get('/:id', getUser);
router.put('/:id', authorize('DONOR', 'NGO', 'VOLUNTEER', 'ADMIN'), updateUser);
router.put('/:id/status', adminOnly, updateUserStatus);
router.delete('/:id', adminOnly, deleteUser);

module.exports = router;

