const User = require('../models/User');
const Message = require('../models/Message');
const { verifySocketToken } = require('../middleware/auth');

// Map userId -> Set of socketIds (supports multiple tabs)
const onlineUsers = new Map();

const getSocketId = (userId) => {
  const sockets = onlineUsers.get(userId.toString());
  return sockets ? [...sockets][0] : null;
};

module.exports = (io) => {
  // ─── Auth Middleware ────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = verifySocketToken(token);
      if (!decoded) return next(new Error('Invalid token'));

      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

    // ─── Online Status ──────────────────────────────
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Update DB
    await User.findByIdAndUpdate(userId, { isOnline: true, socketId: socket.id });

    // Notify all users this user is online
    socket.broadcast.emit('userOnline', { userId });

    // Send current online users list to this socket
    const onlineList = [...onlineUsers.keys()];
    socket.emit('onlineUsers', onlineList);

    // ─── Join personal room ─────────────────────────
    socket.join(userId);

    // ─── Send Message ───────────────────────────────
    socket.on('sendMessage', async (data) => {
      try {
        const { receiverId, text, image, replyTo } = data;

        if (!receiverId || (!text && !image)) return;

        const message = await Message.create({
          senderId:   userId,
          receiverId,
          text:       text || '',
          image:      image || '',
          replyTo:    replyTo || null,
          status:     'sent',
        });

        await message.populate('replyTo', 'text image senderId');

        // Check if receiver is online
        const receiverSockets = onlineUsers.get(receiverId);
        if (receiverSockets && receiverSockets.size > 0) {
          message.status = 'delivered';
          message.deliveredAt = new Date();
          await message.save();
          io.to(receiverId).emit('receiveMessage', message);
        }

        // Also emit back to sender (for multi-tab sync)
        socket.emit('messageSent', message);

        // Update delivered status
        if (receiverSockets?.size > 0) {
          socket.emit('messageDelivered', { messageId: message._id });
        }
      } catch (err) {
        console.error('sendMessage error:', err);
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    // ─── Typing Indicator ───────────────────────────
    socket.on('typing', ({ receiverId, isTyping }) => {
      io.to(receiverId).emit('typing', { senderId: userId, isTyping });
    });

    // ─── Message Seen ────────────────────────────────
    socket.on('messageSeen', async ({ senderId, messageIds }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds }, senderId, receiverId: userId },
          { status: 'seen', seenAt: new Date() }
        );
        // Notify sender their messages were seen
        io.to(senderId).emit('messagesSeen', { by: userId, messageIds });
      } catch (err) {
        console.error('messageSeen error:', err);
      }
    });

    // ─── Edit Message ────────────────────────────────
    socket.on('editMessage', async ({ messageId, text, receiverId }) => {
      try {
        const msg = await Message.findOne({ _id: messageId, senderId: userId });
        if (!msg || msg.isDeleted) return;

        msg.text = text;
        msg.isEdited = true;
        msg.editedAt = new Date();
        await msg.save();

        // Notify both users
        io.to(receiverId).emit('messageEdited', msg);
        socket.emit('messageEdited', msg);
      } catch (err) {
        console.error('editMessage error:', err);
      }
    });

    // ─── Delete Message ──────────────────────────────
    socket.on('deleteMessage', async ({ messageId, receiverId }) => {
      try {
        const msg = await Message.findOne({ _id: messageId, senderId: userId });
        if (!msg) return;

        msg.isDeleted = true;
        msg.text = '';
        msg.image = '';
        await msg.save();

        io.to(receiverId).emit('messageDeleted', { messageId });
        socket.emit('messageDeleted', { messageId });
      } catch (err) {
        console.error('deleteMessage error:', err);
      }
    });

    // ─── React to Message ────────────────────────────
    socket.on('reactToMessage', async ({ messageId, emoji, receiverId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg || msg.isDeleted) return;

        const existingIdx = msg.reactions.findIndex(r => r.userId.toString() === userId);
        if (existingIdx > -1) {
          if (msg.reactions[existingIdx].emoji === emoji) {
            msg.reactions.splice(existingIdx, 1);
          } else {
            msg.reactions[existingIdx].emoji = emoji;
          }
        } else {
          msg.reactions.push({ userId, emoji });
        }
        await msg.save();

        const payload = { messageId, reactions: msg.reactions };
        io.to(receiverId).emit('messageReacted', payload);
        socket.emit('messageReacted', payload);
      } catch (err) {
        console.error('reactToMessage error:', err);
      }
    });

    // ─── Friend Request Events ────────────────────────
    socket.on('friendRequest', ({ receiverId }) => {
      io.to(receiverId).emit('newFriendRequest', { from: socket.user.toPublic() });
    });

    socket.on('friendRequestAccepted', ({ receiverId }) => {
      io.to(receiverId).emit('friendRequestAccepted', { by: socket.user.toPublic() });
    });

    // ─── Disconnect ──────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.user.username}`);

      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          // Mark offline
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date(), socketId: null });
          socket.broadcast.emit('userOffline', { userId, lastSeen: new Date() });
        }
      }
    });
  });

  return { onlineUsers, getSocketId };
};
