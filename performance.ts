import { getStatistics, print } from "./analytics";
import { PerfyllConfig, endMark, init, startMark } from ".";
import { wait } from "./utils";
import { Worker, isMainThread, parentPort } from "worker_threads";

function stringify() {
  JSON.stringify({
    test1: 10000,
    test2: 10000,
    test3: 10000,
    test4: 10000,
    test5: 10000,
    test6: 10000,
    child: {
      test1: 10000,
      test2: 10000,
      test3: 10000,
      test4: 10000,
      test5: 10000,
      test6: 10000,
    },
  });
}

const config: PerfyllConfig = {
  log: false,
  url: "ws://localhost:4000",
};
const ITERATIONS = 10000;
const DELAY = 0;

if (isMainThread) {
  const worker1 = new Worker(__filename);
  const worker2 = new Worker(__filename);

  let resultWithMark: { result: number[]; time: number };
  let resultWithoutMark: { result: number[]; time: number };

  worker1.on("message", (result1: any) => {
    resultWithMark = JSON.parse(result1);
    if (resultWithoutMark) {
      console.log(
        `${config.url} => For ${ITERATIONS} iterations and process with delay of ${DELAY} milli\nwithMark = ${resultWithMark.time}ms\nwithoutMark = ${resultWithoutMark.time}ms\n`
      );
      print(resultWithMark.result, resultWithoutMark.result);
    }
  });

  worker2.on("message", (result2: any) => {
    resultWithoutMark = JSON.parse(result2);
    if (resultWithMark) {
      console.log(
        `${config.url} => For ${ITERATIONS} iterations and process with delay of ${DELAY} milli\nwithMark = ${resultWithMark.time}ms\nwithoutMark = ${resultWithoutMark.time}ms\n`
      );
      print(resultWithMark.result, resultWithoutMark.result);
    }
  });

  worker2.postMessage({ action: "withoutMark" });
  worker1.postMessage({ action: "withMark" });
} else {
  init(config);
  parentPort?.on("message", async (data: any) => {
    // to wait for the websocket connection
    await wait(100);
    if (data.action === "withMark") {
      const now = Date.now();
      const result = await getStatistics(async () => {
        startMark("database");
        stringify();
        await wait(DELAY);
        endMark("database", []);
      }, ITERATIONS);
      const obj = { result, time: Date.now() - now };
      parentPort?.postMessage(JSON.stringify(obj));
    } else {
      const now = Date.now();
      const result = await getStatistics(async () => {
        stringify();
        await wait(DELAY);
      }, ITERATIONS);
      const obj = { result, time: Date.now() - now };
      parentPort?.postMessage(JSON.stringify(obj));
    }
  });
}
