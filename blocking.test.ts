import { startMark, endMark, markOnly, MarkPostBody } from ".";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("Tests for bloking transactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("simple mark", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({} as any);

    const registerUser = async () => {
      startMark("registerUser");
      await wait(100);
      endMark("registerUser", []);
    };

    await registerUser();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: expect.objectContaining({
          marks: [["registerUser", expect.anything(), expect.anything(), expect.anything()]],
        }),
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
      await databaseQuery();
      endMark("registerUser", ["database"]);
    };

    await registerUser();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: expect.objectContaining({
          marks: [
            ["registerUser", expect.anything(), expect.anything(), expect.anything()],
            ["database", expect.anything(), expect.anything(), expect.anything()],
          ],
        }),
      })
    );
  });

  test("mark with markOnly", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({} as any);

    const registerUser = async () => {
      startMark("registerUser");
      await wait(100);
      markOnly("hitThisStage");
      endMark("registerUser", ["hitThisStage"]);
    };

    await registerUser();

    const { body }: { body: MarkPostBody } = fetchSpy.mock.calls.at(0)?.at(1) as any;

    expect(body.marks[1][1]).toBe(body.marks[1][2]);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: expect.objectContaining({
          marks: [
            ["registerUser", expect.anything(), expect.anything(), expect.anything()],
            ["hitThisStage", expect.anything(), expect.anything(), expect.anything()],
          ],
        }),
      })
    );
  });
});
