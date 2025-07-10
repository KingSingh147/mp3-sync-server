const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Server is alive.");
});

const wss = new WebSocket.Server({ server });

console.log(`✅ WebSocket server starting...`);

wss.on("connection", (ws) => {
  console.log("🔗 Client connected");

  ws.on("message", (msg) => {
    console.log("📨 Message received:", msg);
    ws.send("Echo: " + msg);
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });

  // Confirm connection established
  ws.send("✅ Connection established");
});

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
