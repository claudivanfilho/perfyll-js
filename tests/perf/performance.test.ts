import { spawn } from "child_process";
import { print } from "./utils/statistics";
// @ts-ignore-next-line
import { consoleTable } from "js-awe";

describe("Performance tests por the perfyll library on server", () => {
  // test("testing simple mark performance", async () => {
  //   await wait(5000);
  //   const result = await autocannon({
  //     url: "http://localhost:3000/without-perfyll",
  //     connections: 10, //default
  //     pipelining: 5, // default
  //     duration: 5, // default
  //     workers: 2,
  //   });
  //   const result2 = await autocannon({
  //     url: "http://localhost:3100/without-perfyll",
  //     connections: 10, //default
  //     pipelining: 5, // default
  //     duration: 5, // default
  //     workers: 2,
  //   });

  //   console.log(result.requests, result2.requests);
  //   console.log(result.throughput, result2.throughput);
  // }, 30000);

  // test("workers", (done) => {
  //   const workerProcess = spawn("node", ["tests/perf/performance.js"]);
  //   let withPerfyll = 0;
  //   let withoutPerfyll = 0;
  //   // Listen for events from the spawned process
  //   workerProcess.stdout.on("data", (data: string) => {
  //     if (data.toString().includes("with ")) withPerfyll = +data.toString().split("with ")[1];
  //     else withoutPerfyll = +data.toString().split("without ")[1];

  //     console.log(withPerfyll, withoutPerfyll);

  //     //    16831 16240
  //     // 13073 11827
  //     // 18759 17997
  //     if (withPerfyll && withoutPerfyll) done();
  //   });
  // }, 10000);

  test("interative", (done) => {
    const workerProcess = spawn("node", ["tests/perf/utils/memoryAndCpu.js"]);
    let dataWith: any;
    let dataWithout: any;
    // Listen for events from the spawned process
    workerProcess.stdout.on("data", (data: string) => {
      let obj: any;
      try {
        obj = JSON.parse(data.toString());
      } catch {}
      if (obj) {
        if (obj.mode === "withPerfyll") {
          dataWith = obj;
        } else if (obj.mode === "withoutPerfyll") {
          dataWithout = obj;
        }
      }
      if (dataWith && dataWithout) {
        console.log("withPerfyll", dataWith.time);
        console.log("withoutPerfyll", dataWithout.time);
        consoleTable(print(dataWith.result, dataWithout.result));
      }

      if (dataWith && dataWithout) {
        workerProcess.kill();
        done();
      }
    });
  }, 120000);
});
