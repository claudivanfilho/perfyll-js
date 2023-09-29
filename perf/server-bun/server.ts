function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const server = Bun.serve({
  port: 3000,
  async fetch() {
    await wait(10);
    return new Response(JSON.stringify({ message: "ok" }));
  },
  websocket: {
    message(_, message) {
      console.log(message);
    }, // a message is received
    open() {
      console.log("opened");
    }, // a socket is opened
    close() {
      console.log("closed");
    }, // a socket is closed
  },
});

console.log(`Listening on localhost:${server.port}`);
