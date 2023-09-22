import { getStatistics, print } from "./analytics";
import { endMark, init, startMark } from ".";
import { wait } from "./utils";
import { Worker, isMainThread, parentPort } from "worker_threads";

const config = {
  mode: "http",
} as const;
init(config);
const ITERATIONS = 1_000;
const DELAY = 0;

if (isMainThread) {
  const worker1 = new Worker(__filename);
  const worker2 = new Worker(__filename);

  let resultWithMark: number[] = [];
  let resultWithoutMark: number[] = [];

  worker1.on("message", (result1: any) => {
    resultWithMark = JSON.parse(result1);
    if (resultWithoutMark.length) {
      console.log(
        `${config.mode} => For ${ITERATIONS} iterations and process with delay of ${DELAY} milli`
      );
      print(resultWithMark, resultWithoutMark);
    }
  });

  worker2.on("message", (result2: any) => {
    resultWithoutMark = JSON.parse(result2);
    if (resultWithMark.length) {
      print(resultWithMark, resultWithoutMark);
    }
  });

  // to wait for the websocket connection
  worker1.postMessage({ action: "withMark" });
  worker2.postMessage({ action: "withoutMark" });
} else {
  parentPort?.on("message", async (data: any) => {
    await wait(100);
    if (data.action === "withMark") {
      console.time("withMark time");
      const result = await getStatistics(async () => {
        startMark("database");
        await wait(DELAY);
        endMark("database");
      }, ITERATIONS);
      console.timeEnd("withMark time");
      parentPort?.postMessage(JSON.stringify(result));
    } else {
      console.time("withoutMark time");
      const result = await getStatistics(async () => {
        await wait(DELAY);
      }, ITERATIONS);
      console.timeEnd("withoutMark time");
      parentPort?.postMessage(JSON.stringify(result));
    }
  });
}
