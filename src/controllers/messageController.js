// src/controllers/messageController.js
import Message from '../models/Message.js';

export const getMessages = async (req, res) => {
  const id = req.params.id;

  try {
    const isRoom = id.startsWith('room_'); // e.g. room_abc123
    let messages;

    if (isRoom) {
      messages = await Message.find({ room: id }).sort({ createdAt: 1 });
    } else {
      messages = await Message.find({
        $or: [
          { sender: req.user._id, receiver: id },
          { sender: id, receiver: req.user._id }
        ]
      }).sort({ createdAt: 1 });
    }

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
