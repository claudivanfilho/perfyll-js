import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

import { initServer, isStreamming, mark } from "../../../../../server/index";

dotenv.config();

export const app: Express = express();
const port = 3000;

initServer();

app.get("/test", (req: Request, res: Response) => {
  mark("testExpressStreaming", { extra: { mode: "streaming" } }).send();
  res.send("<div data-testid='status-msg'>Is streaming: " + isStreamming() + "</div>");
});

app.get("/", (req: Request, res: Response) => {
  res.send("ok");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
