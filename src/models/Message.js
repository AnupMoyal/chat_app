// import mongoose from 'mongoose';

// const messageSchema = new mongoose.Schema({
//   sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   room: { type: String, required: true },
//   text: { type: String, required: true },
//   timestamp: { type: Date, default: Date.now }
// });

// const Message = mongoose.model('Message', messageSchema);
// export default Message;
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  room: { type: String }, // optional
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

export default Message;

