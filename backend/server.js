const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

require("./config/db");

const app = express();
const server = http.createServer(app);

const defaultOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:5173",
];

const envOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  pingInterval: 25000,
  pingTimeout: 60000,
});

app.use(cors({ origin: allowedOrigins }));
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running 🚀");
});

// routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));

// Socket.IO
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join global or event chat
  socket.on("joinChat", (data) => {
    const { userId, username, eventId } = data || {};

    if (!userId || !username) {
      socket.emit("chat:error", { message: "Invalid user session for chat" });
      return;
    }

    socket.user = { userId, username };
    if (eventId) {
      socket.join(`event-${eventId}`);
      console.log(`${username} joined event chat: ${eventId}`);
    } else {
      socket.join("global");
      console.log(`${username} joined global chat`);
    }
  });

  // Handle chat message
  socket.on("sendMessage", async (data) => {
    try {
      const { message, userId, username, eventId } = data || {};

      if (!message || !String(message).trim()) {
        socket.emit("chat:error", { message: "Message cannot be empty" });
        return;
      }

      if (!userId || !username) {
        socket.emit("chat:error", { message: "Missing user details" });
        return;
      }

      // Save to DB
      const newMessage = await require("./models/Message").create({
        userId,
        username,
        message: String(message).trim(),
        eventId: eventId || null
      });

      // Broadcast to room
      const room = eventId ? `event-${eventId}` : "global";
      io.to(room).emit("message", {
        _id: newMessage._id,
        userId,
        username,
        message: newMessage.message,
        eventId,
        timestamp: newMessage.timestamp
      });
    } catch (error) {
      console.error("Socket sendMessage error:", error);
      socket.emit("chat:error", { message: "Failed to send message" });
    }
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});