const router = require('express').Router();
const {
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  reactToMessage,
  getUnreadCounts,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/unread/count',            protect, getUnreadCounts);
router.get('/:userId',                 protect, getMessages);
router.post('/:userId',                protect, sendMessage);
router.delete('/:messageId',           protect, deleteMessage);
router.put('/:messageId',              protect, editMessage);
router.post('/:messageId/react',       protect, reactToMessage);

module.exports = router;
