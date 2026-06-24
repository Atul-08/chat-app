const router = require('express').Router();
const {
  getUsers,
  getUserById,
  updateProfile,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/',    protect, getUsers);
router.get('/:id', protect, getUserById);
router.put('/profile', protect, updateProfile);

// Friends
router.post('/friend-request/:id',   protect, sendFriendRequest);
router.post('/accept-request/:id',   protect, acceptFriendRequest);
router.post('/reject-request/:id',   protect, rejectFriendRequest);
router.delete('/friend/:id',         protect, removeFriend);

module.exports = router;
