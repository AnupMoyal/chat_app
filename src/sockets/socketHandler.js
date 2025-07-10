// // import jwt from 'jsonwebtoken';
// // import User from '../models/User.js';

// // const socketHandler = async (ws, req, wss) => {
// //   let currentUser = null;
// //   const token = req.url.split('?token=')[1];

// //   try {
// //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
// //     currentUser = await User.findById(decoded.id);
// //     console.log(` ${currentUser.username} connected`);
// //   } catch (err) {
// //     console.log(' Invalid token');
// //     ws.close();
// //     return;
// //   }

// //   ws.on('message', async (msg) => {
// //     try {
// //       const { text } = JSON.parse(msg);
// //       console.log(` ${currentUser.username}: ${text}`);

// //       // Send back the message to the same user
// //       ws.send(JSON.stringify({ sender: currentUser.username, text }));
      
// //     } catch (err) {
// //       console.log(' Message error:', err.message);
// //     }
// //   });

// //   ws.on('close', () => {
// //     console.log(` ${currentUser?.username || 'Client'} disconnected`);
// //   });
// // };

// // export default socketHandler;
// import jwt from 'jsonwebtoken';
// import User from '../models/user.js';
// import Message from '../models/Message.js';

// const onlineUsers = new Map(); // socketId -> userId

// const socketHandler = (io, socket) => {
//   console.log('🟢 Socket connected:', socket.id);

//   // 🔐 Authentication
//   socket.on('authenticate', async (token) => {
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const user = await User.findById(decoded.id);
//       if (!user) return socket.disconnect();

//       socket.userId = user._id.toString();
//       onlineUsers.set(user._id.toString(), socket.id);

//       console.log(`✅ ${user.username} authenticated with socket ID: ${socket.id}`);
//     } catch (err) {
//       console.log('❌ Invalid Token');
//       socket.disconnect();
//     }
//   });

//   // 📩 Private messaging
//   socket.on('private_message', async ({ to, text }) => {
//     const from = socket.userId;
//     if (!from || !to || !text) return;

//     // Save message in DB
//     const message = await Message.create({
//       sender: from,
//       receiver: to,
//       text,
//       room: null // optional if you're not using rooms
//     });

//     // Emit to receiver (if online)
//     const toSocketId = onlineUsers.get(to);
//     if (toSocketId) {
//       io.to(toSocketId).emit('new_message', {
//         from,
//         text,
//         timestamp: message.createdAt,
//       });
//     }

//     // Also emit to sender to update UI
//     socket.emit('new_message', {
//       from,
//       text,
//       timestamp: message.createdAt,
//     });

//     console.log(`📨 ${from} ➡ ${to}: ${text}`);
//   });

//   // ❌ Disconnect
//   socket.on('disconnect', () => {
//     if (socket.userId) {
//       onlineUsers.delete(socket.userId);
//     }
//     console.log('🔴 Socket disconnected:', socket.id);
//   });
// };

// export default socketHandler;

// ✅ socketHandler.js (for Socket.IO & One-to-One Chat)

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/user.js';
import Message from '../models/Message.js';

const onlineUsers = new Map(); // userId => socketId

const socketHandler = (io, socket) => {
  console.log('🟢 Socket connected:', socket.id);

  // ✅ 1. Authenticate socket
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return socket.disconnect();

      socket.userId = user._id.toString();
      onlineUsers.set(user._id.toString(), socket.id);

      console.log(`✅ ${user.username} authenticated with socket ID: ${socket.id}`);
    } catch (err) {
      console.log('❌ Invalid token');
      socket.disconnect();
    }
  });

  // ✅ 2. Private 1-to-1 message
  socket.on('private_message', async ({ to, text }) => {
    const from = socket.userId;
    if (!from || !to || !text) return;

    if (
      !mongoose.Types.ObjectId.isValid(from) ||
      !mongoose.Types.ObjectId.isValid(to)
    ) return;

    const message = await Message.create({
      sender: from,
      receiver: to,
      text,
      room: null
    });

    const payload = {
      from,
      text,
      timestamp: message.createdAt
    };

    const toSocketId = onlineUsers.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('new_message', payload);
    }

    socket.emit('new_message', payload);

    console.log(`📨 [1-to-1] ${from} ➡ ${to}: ${text}`);
  });

  // ✅ 3. Join Room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`📥 ${socket.userId} joined room: ${roomId}`);
  });

  // ✅ 4. Send message to room
  socket.on('room_message', async ({ room, text }) => {
    const from = socket.userId;
    if (!from || !room || !text) return;

    const message = await Message.create({
      sender: from,
      text,
      room,
      receiver: null
    });

    const payload = {
      from,
      text,
      room,
      timestamp: message.createdAt
    };

    io.to(room).emit('new_room_message', payload);

    console.log(`📢 [Room ${room}] ${from}: ${text}`);
  });

  // ✅ 5. Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
    }
    console.log('🔴 Disconnected:', socket.id);
  });
};

export default socketHandler;
