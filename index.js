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

        const { action, room, target, payload } = data;

        // ✅ Register your own room
        if (action === "register") {
            if (!room) return;
            ws.room = room;
            rooms[room] = rooms[room] || [];
            rooms[room].push(ws);
            console.log(`👥 Client registered room: ${room}`);
        }

        // ✅ Handle connection request (invitation)
        if (action === "request_connect") {
            const targetRoom = target;
            if (!targetRoom || !rooms[targetRoom]) {
                console.log(`❌ Target room not found: ${targetRoom}`);
                return;
            }
            rooms[targetRoom].forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        action: "invite",
                        from: ws.room
                    }));
                }
            });
            console.log(`📨 Sent invite to room: ${targetRoom} from ${ws.room}`);
        }

        // ✅ Handle accept connection
        if (action === "accept") {
  const targetRoom = room;
  if (!targetRoom || !rooms[targetRoom]) return;

  rooms[targetRoom].forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        action: "accept",
        room: ws.room
      }));
    }
  });

  console.log(`✅ Connection accepted for room: ${targetRoom}`);

  // 🔥 Add this: put THIS ws (the accepter) into the target room
  ws.room = targetRoom;
  if (!rooms[targetRoom].includes(ws)) {
    rooms[targetRoom].push(ws);
  }
}


        // ✅ Handle reject connection
        if (action === "reject") {
            const targetRoom = room;
            if (!targetRoom || !rooms[targetRoom]) return;
            rooms[targetRoom].forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        action: "reject"
                    }));
                }
            });
            console.log(`❌ Connection rejected for room: ${targetRoom}`);
        }

        // ✅ Handle play broadcasts (sync state)
        if (action === "play") {
            if (ws.room && rooms[ws.room]) {
                rooms[ws.room].forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            action: "play",
                            payload
                        }));
                    }
                });
            }
        }
    });

ws.on("close", () => {
  console.log(`❌ Client disconnected from room: ${ws.room}`);

  if (ws.room && rooms[ws.room]) {
    console.log(`➡️ Notifying ${rooms[ws.room].length - 1} other clients`);

    rooms[ws.room].forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        console.log(`➡️ Sending peer_disconnected to client in room: ${ws.room}`);
        client.send(JSON.stringify({
          action: "peer_disconnected"
        }));
      }
    });

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
