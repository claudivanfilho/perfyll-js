import { endMark, endMarkAsync, startMark, startMarkAsync } from ".";
import { wait } from "./utils";

describe("testing for non bloking functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // test("should send a request with the action when called the trackAsyncPromise function", async () => {
  //   const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({} as any);

  //   const sendEmail = async () => {
  //     await wait(500);
  //   };

  //   // make a non blocking call
  //   sendEmail().then(trackAsyncPromise({ action: "sendEmail" }));

  //   // does not have to be called in the blocking scope
  //   expect(fetchSpy).not.toHaveBeenCalled();

  //   // wait for the action to finish
  //   await wait(500);

  //   expect(fetchSpy.mock.calls.at(0)?.at(0)).toMatch("https://");
  //   const options: any = fetchSpy.mock.calls.at(0)?.at(1);
  //   expect(options.body.actions.length).toBe(1);
  //   expect(options.body.actions[0].length).toBe(3);
  //   expect(options.body.actions[0][0]).toBe("sendEmail");
  //   expect(options.body.actions[0][2] >= options.body.actions[0][1] + 500).toBeTruthy();
  // });

  test("should send a request with the main action when called the trackAsyncPromise function", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({} as any);

    const sendEmail = async () => {
      await wait(500);
      return "email sent";
    };

    // make a non blocking call
    startMark("my-sync-action");
    await wait(100);
    const ref = startMarkAsync({ mark: "sendEmail", mainMark: "my-sync-action" });
    sendEmail().finally(() => endMarkAsync(ref));
    endMark("my-sync-action");

    // does not have to be called in the blocking scope
    expect(fetchSpy).toHaveBeenCalled();

    // wait for the action to finish
    await wait(500);

    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const options: any = fetchSpy.mock.calls.at(0)?.at(1);
    expect(options.body).not.toEqual(expect.objectContaining({ async: true }));
    expect(options.body.timeline.length).toBe(1);
    expect(options.body.timeline[0][0]).toBe("my-sync-action");

    const options2: any = fetchSpy.mock.calls.at(1)?.at(1);
    expect(options2.body).toEqual(
      expect.objectContaining({
        mainMark: "my-sync-action",
        async: true,
      })
    );
    expect(options2.body.timeline.length).toBe(1);
    expect(options2.body.timeline[0][0]).toBe("sendEmail");

    expect(options.body.timeline[0][2] < options2.body.timeline[0][2]).toBeTruthy();
  });
});
