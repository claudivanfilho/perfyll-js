const autocannon = require("autocannon");
import { Worker, isMainThread, parentPort } from "worker_threads";

if (isMainThread) {
  const worker1 = new Worker(__filename);
  const worker2 = new Worker(__filename);

  worker2.postMessage({ action: "withoutMark" });
  worker1.postMessage({ action: "withMark" });

  // worker1.on("message", (result: any) => {
  //   console.log(JSON.parse(result));
  // });
  // worker2.on("message", (result: any) => {
  //   console.log(JSON.parse(result));
  // });
} else {
  parentPort?.on("message", async (data: any) => {
    if (data.action === "withMark") {
      const result = await autocannon({
        url: "http://localhost:3000/with-perfyll",
        connections: 10, //default
        pipelining: 5, // default
        duration: 5, // default
      });
      console.log("with " + result.totalCompletedRequests);
    } else {
      const result = await autocannon({
        url: "http://localhost:3100/with-perfyll",
        connections: 10, //default
        pipelining: 5, // default
        duration: 5, // default
      });
      console.log("without " + result.totalCompletedRequests);
    }
  });
}
