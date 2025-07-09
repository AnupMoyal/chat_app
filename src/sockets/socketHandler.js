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

  // ✅ Step 1: Authenticate user with token
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        console.log('❌ User not found');
        return socket.disconnect();
      }

      socket.userId = user._id.toString();
      onlineUsers.set(user._id.toString(), socket.id);

      console.log(`✅ ${user.username} authenticated (socket ID: ${socket.id})`);
    } catch (err) {
      console.log('❌ Invalid token:', err.message);
      socket.disconnect();
    }
  });

  // ✅ Step 2: Handle private messages
  socket.on('private_message', async ({ to, text }) => {
    const from = socket.userId;
    if (!from || !to || !text) {
      console.log("⚠️ Missing required fields");
      return;
    }

    // Validate ObjectId format
    if (
      !mongoose.Types.ObjectId.isValid(from) ||
      !mongoose.Types.ObjectId.isValid(to)
    ) {
      console.log("❌ Invalid sender or receiver ID format");
      return;
    }

    try {
      // Save to MongoDB
      const message = await Message.create({
        sender: new mongoose.Types.ObjectId(from),
        receiver: new mongoose.Types.ObjectId(to),
        text,
        room: null,
      });

      console.log("✅ Message saved to MongoDB:", message);

      const payload = {
        from,
        text,
        timestamp: message.createdAt,
      };

      // Emit to receiver (if online)
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_message', payload);
      }

      // Emit to sender
      socket.emit('new_message', payload);

      console.log(`📨 ${from} ➡ ${to}: ${text}`);
    } catch (err) {
      console.error("❌ Error saving message:", err.message);
    }
  });

  // ✅ Step 3: Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
    }
    console.log('🔴 Socket disconnected:', socket.id);
  });
};

export default socketHandler;

