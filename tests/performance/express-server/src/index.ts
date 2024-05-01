import cluster from "cluster";
import express, { Request, Response } from "express";
import dotenv from "dotenv";

import { initServer, isStreamming, mark, startMark, endMark } from "../../../../server/index";

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  cluster.fork();
  cluster.fork();

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  dotenv.config();
  initServer({
    publicKey: "123",
    customHttpUrl: "http://localhost:4000",
    customWSUrl: "ws://localhost:6000",
    secret: "123",
  });

  const app = express();

  app.get("/", (req, res) => {
    res.send("Hello from Server 1!");
  });

  app.get("/with-perfyll", (req: Request, res: Response) => {
    mark("testExpressStreaming", { extra: { mode: "streaming" } }).send();
    JSON.parse(JSON.stringify(process.env));
    res.send("<div data-testid='status-msg'>Is streaming: " + isStreamming() + "</div>");
  });

  app.get("/with-perfyll-duration", (req: Request, res: Response) => {
    startMark("testMarkWithDuration");
    JSON.parse(JSON.stringify(process.env));
    endMark("testMarkWithDuration").send();
    res.send("<div data-testid='status-msg'>Is streaming: " + isStreamming() + "</div>");
  });

  app.get("/without-perfyll", (req: Request, res: Response) => {
    JSON.parse(JSON.stringify(process.env));
    res.send("<div data-testid='status-msg'>Is streaming: " + isStreamming() + "</div>");
  });

  app.get("/", (req: Request, res: Response) => {
    res.send("ok");
  });

  let port = 3000;

  if ((cluster as any).worker.id === 2) {
    port = 3100;
  }

  app.listen(port, () => {
    console.log(`Server ${(cluster as any).worker.id} is running on port ${port}`);
  });
  // Create two Express servers
}
