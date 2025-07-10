const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`✅ WebSocket server running on port ${PORT}`);

// Keep track of all rooms and clients
const rooms = {};

wss.on("connection", (ws) => {
  console.log("🔗 New client connected");

  ws.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      console.error("❌ Invalid JSON:", err);
      return;
    }

    const { action, room, payload } = data;

    if (action === "join") {
      if (!room) return;
      ws.room = room;
      rooms[room] = rooms[room] || [];
      rooms[room].push(ws);
      console.log(`👥 Client joined room: ${room}`);
    }

    if (action === "broadcast" && ws.room) {
      // Broadcast to others in the same room
      rooms[ws.room].forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(payload));
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room] = rooms[ws.room].filter((client) => client !== ws);
      if (rooms[ws.room].length === 0) {
        delete rooms[ws.room];
      }
    }
  });
});
