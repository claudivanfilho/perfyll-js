// @ts-ignore-next-line
import { consoleTable } from "js-awe";

function calculatePercentageDifference(value1: number, value2: number): string {
  if (value1 === value2) {
    return "Equal";
  }

  const max = Math.max(value1, value2);
  const min = Math.min(value1, value2);
  const percentage = ((max - min) / min) * 100;

  return `${value1 > value2 ? "+" : "-"} ${percentage.toFixed(2)}%`;
}

export async function getStatistics(cb: () => Promise<void>, iterations = 10) {
  const data: number[] = [];
  const memoryUsageInitial = process.memoryUsage();
  data.push(memoryUsageInitial.rss / (1024 * 1024));
  data.push(memoryUsageInitial.heapTotal / (1024 * 1024));
  data.push(memoryUsageInitial.heapUsed / (1024 * 1024));
  data.push(memoryUsageInitial.external / (1024 * 1024));
  const startUsage = process.cpuUsage();

  for (let i = 0; i < iterations; i++) {
    await cb();
    if (i === Math.floor(iterations / 2)) {
      const memoryUsageMiddle = process.memoryUsage();
      data.push(memoryUsageMiddle.rss / (1024 * 1024));
      data.push(memoryUsageMiddle.heapTotal / (1024 * 1024));
      data.push(memoryUsageMiddle.heapUsed / (1024 * 1024));
      data.push(memoryUsageMiddle.external / (1024 * 1024));
    }
  }

  const endUsage = process.cpuUsage(startUsage);
  data.push(endUsage.user / 1000);
  data.push(endUsage.system / 1000);

  const memoryUsageFinal = process.memoryUsage();
  data.push(memoryUsageFinal.rss / (1024 * 1024));
  data.push(memoryUsageFinal.heapTotal / (1024 * 1024));
  data.push(memoryUsageFinal.heapUsed / (1024 * 1024));
  data.push(memoryUsageFinal.external / (1024 * 1024));

  return data;
}

export function print(data: number[], data2: number[]) {
  const labels = [
    "memory.rss",
    "memory.heapTotal",
    "memory.heapUsed",
    "memory.external",
    "memory.rss.middle",
    "memory.heapTotal.middle",
    "memory.heapUsed.middle",
    "memory.external.middle",
    "cpu.user",
    "cpu.system",
    "memory.rss.final",
    "memory.heapTotal.final",
    "memory.heapUsed.final",
    "memory.external.final",
  ];

  const results: any = [];
  labels.map((label, index) => {
    results.push({
      label,
      withMark: data[index],
      withoutMark: data2[index],
      result: calculatePercentageDifference(data[index], data2[index]),
    });
  });
  consoleTable(results);
}
