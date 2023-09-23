import { MarkPostBody, endMark, endMarkAsync, startMark, startMarkAsync } from ".";
import { wait } from "./utils";

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
    endMark("my-sync-action", []);

    // does not have to be called in the blocking scope
    expect(fetchSpy).toHaveBeenCalled();

    // wait for the action to finish
    await wait(500);

    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const options: { body: MarkPostBody } = fetchSpy.mock.calls.at(0)?.at(1) as any;
    expect(options.body).not.toEqual(expect.objectContaining({ async: true }));
    expect(options.body.marks.length).toBe(1);
    expect(options.body.marks[0][0]).toBe("my-sync-action");

    const options2: { body: MarkPostBody } = fetchSpy.mock.calls.at(1)?.at(1) as any;
    expect(options2.body).toEqual(
      expect.objectContaining({
        mainMark: "my-sync-action",
        async: true,
      })
    );
    expect(options2.body.marks.length).toBe(1);
    expect(options2.body.marks[0][0]).toBe("sendEmail");

    expect(options2.body.mainMarkHash).toBe(options.body.mainMarkHash);
    expect(options.body.marks[0][2] < options2.body.marks[0][2]).toBeTruthy();
  });
});
