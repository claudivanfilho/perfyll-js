import { startMark, endMark, startSubMark, endSubMark } from ".";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("testing for bloking functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("should send a request with the action when called the track function", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({} as any);

    const registerUser = async () => {
      startMark("registerUser");
      await wait(100);
      endMark("registerUser");
    };

    await registerUser();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: expect.objectContaining({
          timeline: [["registerUser", expect.anything(), expect.anything(), expect.anything()]],
        }),
      })
    );
  });

  test("should send a request with the action when called the track function in deep", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({} as any);

    const databaseQuery = async () => {
      startSubMark("database");
      await wait(100);
      endSubMark("database");
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
          timeline: [
            ["registerUser", expect.anything(), expect.anything(), expect.anything()],
            ["database", expect.anything(), expect.anything(), expect.anything()],
          ],
        }),
      })
    );
  });
});
