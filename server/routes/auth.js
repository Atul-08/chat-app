const router = require('express').Router();
const {
  register,
  login,
  logout,
  getMe,
  sendOTP,
  verifyOTP
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

router.post('/register', register);
router.post('/login',    login);
router.post('/logout',   protect, logout);
router.get('/me',        protect, getMe);

module.exports = router;
