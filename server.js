import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors'; // ✅ add this
import { Server } from 'socket.io';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import socketHandler from './src/sockets/socketHandler.js';
import userRoutes from './src/routes/userRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';

const app = express();
const server = http.createServer(app);

// ✅ Apply CORS to Express API
app.use(cors({
  origin: '*', // or use frontend domain like 'http://localhost:3000'
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: "*", // or your frontend domain
    methods: ["GET", "POST"]
  }
});

// Connect DB
connectDB();

// JSON Parser
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// WebSocket Handler
io.on('connection', (socket) => {
  socketHandler(io, socket);
});

// Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
