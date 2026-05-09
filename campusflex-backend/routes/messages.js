const router       = require("express").Router();
const Message      = require("../models/Message");
const User         = require("../models/User");
const Notification = require("../models/Notification");
const { protect }  = require("../middleware/auth");

// 1. GET /api/messages/conversations — Inbox view
router.get("/conversations", protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }],
    })
      .populate("sender", "username profilePicture verified")
      .populate("recipient", "username profilePicture verified")
      .sort({ createdAt: -1 });

    const seen = new Set();
    const convos = [];

    for (const msg of messages) {
      if (!msg.sender || !msg.recipient) continue;

      const other = msg.sender._id.toString() === req.user._id.toString()
        ? msg.recipient
        : msg.sender;

      if (!seen.has(other._id.toString())) {
        seen.add(other._id.toString());
        const unread = await Message.countDocuments({
          sender: other._id, recipient: req.user._id, read: false,
        });
        // Matches the "otherUser" and "unreadCount" frontend logic
        convos.push({ otherUser: other, lastMessage: msg, unreadCount: unread });
      }
    }
    res.json(convos);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 2. GET /api/messages/history/:userId — Load one-on-one chat
router.get("/history/:userId", protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user._id },
      ],
    })
      .populate("sender", "username profilePicture verified")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 3. POST /api/messages/send — Fixes the "Sending Failed" error
router.post("/send", protect, async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Empty message" });

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      text: text.trim(),
    });

    const populated = await Message.findById(message._id)
      .populate("sender", "username profilePicture verified");

    // Notification Logic
    await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: "message",
      text: `@${req.user.username} sent you a message`,
    }).catch(() => {}); // Silent catch to prevent crash if notification fails

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Send failed" });
  }
});
// 4. POST /api/messages/read/:userId — Mark as read
router.post("/read/:userId", protect, async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.userId, recipient: req.user._id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// 5. DELETE /api/messages/conversation/:userId — Delete specific chat
router.delete("/conversation/:userId", protect, async (req, res) => {
  try {
    await Message.deleteMany({
      $or: [
        { sender: req.user._id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user._id }
      ]
    });
    res.json({ message: "Conversation deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// 6. DELETE /api/messages/inbox/clear — Clear entire inbox
router.delete("/inbox/clear", protect, async (req, res) => {
  try {
    await Message.deleteMany({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }]
    });
    res.json({ message: "Inbox cleared" });
  } catch (err) {
    res.status(500).json({ message: "Clear failed" });
  }
});

// 7. GET /api/messages/unread/count — Nav badge count
router.get("/unread/count", protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({ recipient: req.user._id, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;