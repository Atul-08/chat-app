const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emoji:  { type: String, required: true },
}, { _id: false });

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // For group chats (optional)
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    text: {
      type: String,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    // Message status
    status: {
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent',
    },
    seenAt: Date,
    deliveredAt: Date,
    // Edit / delete
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    editedAt: Date,
    // Reply to message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    // Reactions
    reactions: [reactionSchema],
  },
  { timestamps: true }
);

// Index for fast conversation queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, status: 1 });

module.exports = mongoose.model('Message', messageSchema);
