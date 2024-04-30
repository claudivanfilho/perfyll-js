// import * as dotenv from "dotenv";
// dotenv.config();

// import { getStatistics, print } from "./analytics";
// import { PerfyllConfig, endMark, init, startMark } from "../../index";
// import { wait } from "./utils";
// import { Worker, isMainThread, parentPort } from "worker_threads";

// const config: PerfyllConfig = {
//   publicKey: process.env.PUBLIC_KEY!,
//   secret: process.env.SECRET,
//   serviceName: "my-server",
// };

// const ITERATIONS = 1;
// const DELAY = 10;

// if (isMainThread) {
//   const worker1 = new Worker(__filename);
//   const worker2 = new Worker(__filename);

//   let resultWithMark: { result: number[]; time: number };
//   let resultWithoutMark: { result: number[]; time: number };

//   worker1.on("message", (result1: any) => {
//     resultWithMark = JSON.parse(result1);
//     if (resultWithoutMark) {
//       console.log(
//         `For ${ITERATIONS} iterations and process with delay of ${DELAY} milli\nwithMark = ${resultWithMark.time}ms\nwithoutMark = ${resultWithoutMark.time}ms\n`
//       );
//       print(resultWithMark.result, resultWithoutMark.result);
//     }
//   });

//   worker2.on("message", (result2: any) => {
//     resultWithoutMark = JSON.parse(result2);
//     if (resultWithMark) {
//       console.log(
//         `For ${ITERATIONS} iterations and process with delay of ${DELAY} milli\nwithMark = ${resultWithMark.time}ms\nwithoutMark = ${resultWithoutMark.time}ms\n`
//       );
//       print(resultWithMark.result, resultWithoutMark.result);
//     }
//   });

//   worker2.postMessage({ action: "withoutMark" });
//   worker1.postMessage({ action: "withMark" });
// } else {
//   parentPort?.on("message", async (data: any) => {
//     // to wait for the websocket connection
//     if (data.action === "withMark") {
//       init(config);
//       await wait(5000);
//       const now = Date.now();
//       const result = await getStatistics(async () => {
//         startMark("markTest");
//         await wait(15);
//         endMark("markTest").send();
//       }, ITERATIONS);
//       const obj = { result, time: Date.now() - now };
//       parentPort?.postMessage(JSON.stringify(obj));
//     } else {
//       await wait(3000);
//       const now = Date.now();
//       const result = await getStatistics(async () => {
//         await wait(DELAY);
//       }, ITERATIONS);
//       const obj = { result, time: Date.now() - now };
//       parentPort?.postMessage(JSON.stringify(obj));
//     }
//   });
// }
