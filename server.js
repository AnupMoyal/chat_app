// import dotenv from 'dotenv';
// dotenv.config();

// import express from 'express';
// import http from 'http';
// import { WebSocketServer } from 'ws';
// import connectDB from './src/config/db.js';
// import authRoutes from './src/routes/authRoutes.js';
// import socketHandler from './src/sockets/socketHandler.js';

// const app = express();
// const server = http.createServer(app);
// const wss = new WebSocketServer({ server });

// // Connect to MongoDB
// connectDB();

// // Middleware
// app.use(express.json());
// app.use('/api/auth', authRoutes);

// // WebSocket connection
// wss.on('connection', (ws, req) => {
//   socketHandler(ws, req, wss); // ✅ No openai passed here
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import socketHandler from './src/sockets/socketHandler.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // for dev mode
    methods: ["GET", "POST"]
  }
});

connectDB();

app.use(express.json());
app.use('/api/auth', authRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
  socketHandler(io, socket);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
