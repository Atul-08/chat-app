require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');

const connectDB       = require('./utils/db');
const authRoutes      = require('./routes/auth');
const userRoutes      = require('./routes/users');
const messageRoutes   = require('./routes/messages');
const socketHandler   = require('./socket/socketHandler');
const { errorHandler } = require('./middleware/error');

// Connect DB
connectDB();

const app    = express();
const server = http.createServer(app);

// ─── Socket.io ──────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:      process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
  pingTimeout:  60000,
  pingInterval: 25000,
});

socketHandler(io);

// Attach io to app so controllers can emit if needed
app.set('io', io);

// ─── Middleware ──────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // 10mb for base64 images
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── Routes ─────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'ChatApp API 💬' }));
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/messages', messageRoutes);

// 404
app.use('*', (req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
);

// Error handler
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n💬 ChatApp server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.message);
  server.close(() => process.exit(1));
});
