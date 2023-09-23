const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let count = 0;

app.use(bodyParser.json());

// Express route
app.post("/test", (req, res) => {
  count += 1;
  console.log(req.body, count);
  res.send("ok");
});

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  ws.on("message", (message) => {
    console.log(`Received: ${message} ${count}`);
    count += 1;
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Express server and WebSocket server listening on port ${PORT}`);
});
