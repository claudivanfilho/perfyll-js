import express, { Express, Response } from "express";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";

dotenv.config();

export const app: Express = express();
const port = 4000;

const wss = new WebSocketServer({ port: 6000 });

app.get("/", (_, res: Response) => {
  res.send("ok");
});

app.post("/analytics", (res: Response) => {
  res.send("ok");
});

app.post("/log", (res: Response) => {
  res.send("ok");
});

app.post("/instance", (_, res: Response) => {
  res.json({ instanceId: "1" });
});

app.listen(port, () => {
  console.log(`Fake Perfyll HTTP Server is running at http://localhost:${port}`);
});

wss.on("connection", async (ws) => {
  ws.on("message", async (message) => {
    ws.send("ok");
  });
  ws.on("close", () => {
    console.log("Fake Perfyll websocket client disconnected");
  });
  console.log("Fake Perfyll websocket client connected");
});
