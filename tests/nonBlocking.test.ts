import { endMark, endMarkAsync, init, startMark, startMarkAsync } from "../index";
import { wait } from "../perf/utils";

init({
  url: "http://localhost",
});

describe("Tests for non bloking transactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("mark with an async mark", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({} as any);

    const sendEmail = async () => {
      await wait(500);
      return "email sent";
    };

    // make a non blocking call
    startMark("my-sync-action");
    await wait(100);
    const ref = startMarkAsync("sendEmail", "my-sync-action");
    sendEmail().finally(() => endMarkAsync(ref));
    endMark("my-sync-action", ["sendEmail"]);

    // does not have to be called in the blocking scope
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // wait for the action to finish
    await wait(600);

    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const { body: bodyString }: { body: string } = fetchSpy.mock.calls.at(0)?.at(1) as any;
    const body = JSON.parse(bodyString);

    expect(body.marks.length).toBe(2);
    expect(body.marks[0][0]).toBe("my-sync-action");
    expect(body.marks[1][2]).toBe(0);

    const { body: bodyString2 }: { body: string } = fetchSpy.mock.calls.at(1)?.at(1) as any;
    const body2 = JSON.parse(bodyString2);

    expect(body2).toEqual(
      expect.objectContaining({
        main: "my-sync-action",
      })
    );
    expect(body2.marks.length).toBe(1);
    expect(body2.marks[0][0]).toBe("sendEmail");

    expect(body2.mainMarkHash).toBe(body.mainMarkHash);
    expect(body.marks[0][2] < body2.marks[0][2]).toBeTruthy();
  });
});
