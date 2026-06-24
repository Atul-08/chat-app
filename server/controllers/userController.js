const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/error');
const { uploadToCloudinary } = require('../utils/cloudinary');

// GET /api/users — search/list users (excluding self)
exports.getUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const query = { _id: { $ne: req.user._id } };

  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email:    { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const users = await User.find(query)
    .select('username profilePic bio isOnline lastSeen friends')
    .sort({ isOnline: -1, username: 1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, users });
});

// GET /api/users/:id
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -socketId')
    .populate('friends', 'username profilePic isOnline lastSeen');

  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, user });
});

// PUT /api/users/profile — update profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { username, bio, profilePicBase64 } = req.body;
  const updates = {};

  if (username) {
    const exists = await User.findOne({ username, _id: { $ne: req.user._id } });
    if (exists) throw new AppError('Username already taken', 400);
    updates.username = username;
  }

  if (bio !== undefined) updates.bio = bio;

  // Handle base64 image upload to Cloudinary
  if (profilePicBase64) {
    const url = await uploadToCloudinary(profilePicBase64, 'chatapp/profiles');
    if (url) updates.profilePic = url;
    else {
      // If no Cloudinary, store base64 directly (dev only)
      updates.profilePic = profilePicBase64;
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated', user: user.toPublic() });
});

// POST /api/users/friend-request/:id — send friend request
exports.sendFriendRequest = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  if (targetId === req.user._id.toString()) {
    throw new AppError("Can't send request to yourself", 400);
  }

  const target = await User.findById(targetId);
  if (!target) throw new AppError('User not found', 404);

  if (req.user.friends.includes(targetId)) throw new AppError('Already friends', 400);
  if (req.user.sentRequests.includes(targetId)) throw new AppError('Request already sent', 400);

  // Add to sender's sentRequests, target's friendRequests
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { sentRequests: targetId } });
  await User.findByIdAndUpdate(targetId, { $addToSet: { friendRequests: req.user._id } });

  res.json({ success: true, message: 'Friend request sent' });
});

// POST /api/users/accept-request/:id
exports.acceptFriendRequest = asyncHandler(async (req, res) => {
  const senderId = req.params.id;

  if (!req.user.friendRequests.map(String).includes(senderId)) {
    throw new AppError('No friend request from this user', 400);
  }

  // Add to each other's friends, remove from requests
  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { friends: senderId },
    $pull:     { friendRequests: senderId },
  });
  await User.findByIdAndUpdate(senderId, {
    $addToSet: { friends: req.user._id },
    $pull:     { sentRequests: req.user._id },
  });

  res.json({ success: true, message: 'Friend request accepted' });
});

// POST /api/users/reject-request/:id
exports.rejectFriendRequest = asyncHandler(async (req, res) => {
  const senderId = req.params.id;

  await User.findByIdAndUpdate(req.user._id, { $pull: { friendRequests: senderId } });
  await User.findByIdAndUpdate(senderId, { $pull: { sentRequests: req.user._id } });

  res.json({ success: true, message: 'Friend request rejected' });
});

// DELETE /api/users/friend/:id
exports.removeFriend = asyncHandler(async (req, res) => {
  const friendId = req.params.id;

  await User.findByIdAndUpdate(req.user._id, { $pull: { friends: friendId } });
  await User.findByIdAndUpdate(friendId, { $pull: { friends: req.user._id } });

  res.json({ success: true, message: 'Friend removed' });
});
