import { spawn } from "child_process";
import { print } from "./utils/statistics";
// @ts-ignore-next-line
import { consoleTable } from "js-awe";

describe("Performance tests por the perfyll library on server", () => {
  test("test memory and cpu at a high workload", (done) => {
    const workerProcess = spawn("node", ["tests/performance/utils/memoryAndCpu.js"]);
    let dataWith: any;
    let dataWithout: any;
    workerProcess.stdout.on("data", (data: string) => {
      let obj: any;
      try {
        obj = JSON.parse(data.toString());
      } catch {}
      if (obj) {
        if (obj.mode === "withPerfyll") dataWith = obj;
        else if (obj.mode === "withoutPerfyll") dataWithout = obj;
      }
      if (dataWith && dataWithout) {
        const timeDiff = Math.abs(100 - (dataWithout.time / dataWith.time) * 100);
        const statistics = print(dataWith.result, dataWithout.result);
        const memoryRSSDiff = statistics.find(
          (data: any) => data.label === "memory.rss.final"
        ).result;
        const cpuUserDiff = statistics.find((data: any) => data.label === "cpu.user").result;
        const logText = "percent difference between with and without perfyll";
        console.log(`time: ${logText} ${timeDiff}%`);
        console.log(`memory: ${logText} ${memoryRSSDiff}%`);
        console.log(`cpu: ${logText} ${cpuUserDiff}%`);
        consoleTable(statistics);
        workerProcess.kill();

        done();
        // assert that the time with perfyll is not more than 2% high
        expect(timeDiff).toBeLessThanOrEqual(2);
        // assert that the cpu use with perfyll is not more than 2% high
        expect(cpuUserDiff).toBeLessThanOrEqual(2);
        // assert that the rss memory is not more than 2% high
        expect(memoryRSSDiff).toBeLessThanOrEqual(2);
      }
    });
  }, 120000);
});
