import { startMark, endMark, mark, init } from "../../index";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

init({
  publicKey: "123",
  forceHttp: true,
  logTimeline: true,
});

describe("Tests for bloking transactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("simple mark", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({} as any);

    const registerUser = async () => {
      startMark("registerUser");
      await wait(100);
      endMark("registerUser").send();
    };

    await registerUser();

    const { body: bodyString }: { body: string } = fetchSpy.mock.calls.at(0)?.at(1) as any;
    const body = JSON.parse(bodyString);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(body).toStrictEqual(
      expect.objectContaining({
        marks: [["registerUser", expect.anything(), expect.anything(), expect.anything()]],
      })
    );
  });

  test("mark with subMarks", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({} as any);

    const databaseQuery = async () => {
      startMark("database");
      await wait(100);
      endMark("database");
    };

    const registerUser = async () => {
      startMark("registerUser");
      await wait(20);
      await databaseQuery();
      await wait(100);
      endMark("registerUser").send(["database"]);
    };

    await registerUser();

    const { body }: { body: string } = fetchSpy.mock.calls.at(0)?.at(1) as any;
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(body)).toStrictEqual(
      expect.objectContaining({
        marks: [
          ["registerUser", expect.anything(), expect.anything(), expect.anything()],
          ["database", expect.anything(), expect.anything(), expect.anything()],
        ],
      })
    );
  });

  test("mark with markOnly", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({} as any);

    const registerUser = async () => {
      startMark("registerUser");
      await wait(100);
      mark("hitThisStage");
      await wait(20);
      endMark("registerUser").send(["hitThisStage"]);
    };

    await registerUser();

    const { body: bodyString }: { body: string } = fetchSpy.mock.calls.at(0)?.at(1) as any;
    const body = JSON.parse(bodyString);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(body.marks[1][1]).toBe(body.marks[1][2]);
    expect(body).toStrictEqual(
      expect.objectContaining({
        marks: [
          ["registerUser", expect.anything(), expect.anything(), expect.anything()],
          ["hitThisStage", expect.anything(), expect.anything(), expect.anything()],
        ],
      })
    );
  });
});
