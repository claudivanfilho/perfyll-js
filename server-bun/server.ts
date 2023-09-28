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
    message(ws, message) {
      console.log(message);
    }, // a message is received
    open(ws) {
      console.log("opened");
    }, // a socket is opened
    close(ws, code, message) {
      console.log("closed");
    }, // a socket is closed
    drain(ws) {}, // the socket is ready to receive more data
  },
});

console.log(`Listening on localhost:${server.port}`);
