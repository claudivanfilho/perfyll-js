import autocannon from "autocannon";

describe("Performance tests por the perfyll library on server", () => {
  test("testing simple mark performance", async () => {
    // await wait(5000);
    const [result, result2] = await Promise.all([
      autocannon({
        url: "http://localhost:3000/with-perfyll",
        connections: 1000,
        pipelining: 5,
        duration: 100,
      }),
      autocannon({
        url: "http://localhost:3100/without-perfyll",
        connections: 1000,
        pipelining: 5,
        duration: 100,
      }),
    ]);

    console.log(result.requests, result2.requests);
    const requestP90Diff = Math.abs(100 - (result.requests.p90 / result2.requests.p90) * 100);
    const throughputP90Diff = Math.abs(
      100 - (result.throughput.p90 / result2.throughput.p90) * 100
    );
    const requestSentDiff = Math.abs(100 - (result.requests.sent / result2.requests.sent) * 100);
    expect(requestSentDiff).toBeLessThanOrEqual(10);
    expect(requestP90Diff).toBeLessThanOrEqual(6);
    expect(throughputP90Diff).toBeLessThanOrEqual(6);
  }, 180000);
});
