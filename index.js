const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebSocket server is running.");
});

const wss = new WebSocket.Server({ server });

console.log(`✅ WebSocket server starting...`);

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

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
