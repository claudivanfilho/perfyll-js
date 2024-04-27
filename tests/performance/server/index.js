const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// const { init, startMark, endMark } = require("../dist/index");
// init({
//   url: process.env.WS_ENDPOINT,
//   apiKey: process.env.WS_API_KEY,
//   secret: "123",
//   log: false,
// });

let count = 0;

app.use(bodyParser.json());

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.post("/test", async (_, res) => {
  // startMark("teste2");
  await wait(10);
  // endMark("teste2", []);
  res.send("ok");
});

wss.on("connection", async (ws) => {
  ws.on("message", async (message) => {
    console.log(`Received: ${message} ${count}`);
    count += 1;
    ws.send("ok");
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });
  await wait(4000);
  console.log("WebSocket client connected");
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Express server and WebSocket server listening on port ${PORT}`);
});
