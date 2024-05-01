import { Worker, isMainThread, parentPort } from "worker_threads";
import { getStatistics } from "./statistics";
import { initServer, startMark, endMark, close } from "../../../dist/server/index";

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if (isMainThread) {
  const worker1 = new Worker(__filename);
  const worker2 = new Worker(__filename);

  worker2.postMessage({ action: "withoutMark" });
  worker1.postMessage({ action: "withMark" });
} else {
  parentPort?.on("message", async (data: any) => {
    if (data.action === "withMark") {
      initServer({
        publicKey: "123",
        customHttpUrl: "http://localhost:4000",
        secret: "1234",
        customWSUrl: "ws://localhost:6000",
      });
      await wait(5000);
      const now = Date.now();
      const result = await getStatistics(async () => {
        startMark("markTest");
        JSON.parse(JSON.stringify(process));
        endMark("markTest").send();
      }, 20000);
      close();
      console.log(
        JSON.stringify({
          time: Date.now() - now,
          result,
          mode: "withPerfyll",
        })
      );
    } else {
      initServer({
        publicKey: "123",
        customHttpUrl: "http://localhost:4000",
        secret: "1234",
        customWSUrl: "ws://localhost:6000",
      });
      await wait(5000);
      const now = Date.now();
      const result = await getStatistics(async () => {
        JSON.parse(JSON.stringify(process));
      }, 20000);
      close();
      console.log(
        JSON.stringify({
          time: Date.now() - now,
          result,
          mode: "withoutPerfyll",
        })
      );
    }
  });
}
