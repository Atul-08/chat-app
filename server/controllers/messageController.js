const Message = require('../models/Message');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/error');
const { uploadToCloudinary } = require('../utils/cloudinary');

// GET /api/messages/:userId — get conversation
exports.getMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 30 } = req.query;
  const myId = req.user._id;

  const skip = (Number(page) - 1) * Number(limit);

  const messages = await Message.find({
    $or: [
      { senderId: myId, receiverId: userId },
      { senderId: userId, receiverId: myId },
    ],
    isDeleted: false,
  })
    .populate('replyTo', 'text image senderId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Mark messages as seen
  await Message.updateMany(
    { senderId: userId, receiverId: myId, status: { $ne: 'seen' } },
    { status: 'seen', seenAt: new Date() }
  );

  res.json({
    success: true,
    messages: messages.reverse(), // oldest first
    page: Number(page),
  });
});

// POST /api/messages/:userId — send message (REST fallback; real-time via socket)
exports.sendMessage = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { text, imageBase64, replyTo } = req.body;

  if (!text && !imageBase64) throw new AppError('Message must have text or image', 400);

  const receiver = await User.findById(userId);
  if (!receiver) throw new AppError('Recipient not found', 404);

  let imageUrl = '';
  if (imageBase64) {
    const url = await uploadToCloudinary(imageBase64, 'chatapp/messages');
    imageUrl = url || imageBase64; // fallback to base64 in dev
  }

  const message = await Message.create({
    senderId:   req.user._id,
    receiverId: userId,
    text:       text || '',
    image:      imageUrl,
    replyTo:    replyTo || null,
  });

  await message.populate('replyTo', 'text image senderId');

  res.status(201).json({ success: true, message });
});

// DELETE /api/messages/:messageId — soft delete
exports.deleteMessage = asyncHandler(async (req, res) => {
  const msg = await Message.findById(req.params.messageId);
  if (!msg) throw new AppError('Message not found', 404);
  if (msg.senderId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to delete this message', 403);
  }

  msg.isDeleted = true;
  msg.text = '';
  msg.image = '';
  await msg.save();

  res.json({ success: true, message: 'Message deleted' });
});

// PUT /api/messages/:messageId — edit message
exports.editMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) throw new AppError('New text is required', 400);

  const msg = await Message.findById(req.params.messageId);
  if (!msg) throw new AppError('Message not found', 404);
  if (msg.senderId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to edit this message', 403);
  }
  if (msg.isDeleted) throw new AppError('Cannot edit a deleted message', 400);

  msg.text = text;
  msg.isEdited = true;
  msg.editedAt = new Date();
  await msg.save();

  res.json({ success: true, message: msg });
});

// POST /api/messages/:messageId/react — add/toggle reaction
exports.reactToMessage = asyncHandler(async (req, res) => {
  const { emoji } = req.body;
  if (!emoji) throw new AppError('Emoji required', 400);

  const msg = await Message.findById(req.params.messageId);
  if (!msg) throw new AppError('Message not found', 404);

  const userId = req.user._id.toString();
  const existingIdx = msg.reactions.findIndex(r => r.userId.toString() === userId);

  if (existingIdx > -1) {
    if (msg.reactions[existingIdx].emoji === emoji) {
      // Remove reaction
      msg.reactions.splice(existingIdx, 1);
    } else {
      // Update reaction
      msg.reactions[existingIdx].emoji = emoji;
    }
  } else {
    msg.reactions.push({ userId: req.user._id, emoji });
  }

  await msg.save();
  res.json({ success: true, reactions: msg.reactions });
});

// GET /api/messages/unread/count — unread count per sender
exports.getUnreadCounts = asyncHandler(async (req, res) => {
  const counts = await Message.aggregate([
    { $match: { receiverId: req.user._id, status: { $ne: 'seen' }, isDeleted: false } },
    { $group: { _id: '$senderId', count: { $sum: 1 } } },
  ]);

  const result = {};
  counts.forEach(c => { result[c._id.toString()] = c.count; });

  res.json({ success: true, unreadCounts: result });
});
