import { WebSocket } from "ws";
import {
  fetcher,
  config,
  init as frontInit,
  instanceId,
  ws,
  setState,
  getConfigValue,
} from "../methods";
import { PerfyllConfigServer as Config } from "../types";
import * as base from "../index";

const VERSION = "1.0.0";
const RECONNECT_INTERVAL = 10000;
const MAX_RECONNECT_RETRIES = 2;

let timeout: ReturnType<typeof setTimeout>;
let instanceCountry: string;
let reconnectRetries = 0;

async function createInstance() {
  return fetcher("/instance", { serviceName: config.serviceName! }).then((res) =>
    (res as Response).json()
  );
}

/**
 * The initialization function, it must be declared outside the function scope.
 * @param conf
 */
export function initServer(conf: Config = {}) {
  frontInit(conf);
  const shouldConnect = !getConfigValue("FORCE_HTTP") && (!ws || ws.readyState !== ws.OPEN);
  if (!instanceId) {
    createInstance().then((res) => {
      if (res) {
        setState({ instanceId: res.instanceId });
        instanceCountry = res.country;
        instanceId && shouldConnect && connectWS();
      }
    });
  } else if (shouldConnect) {
    connectWS();
  }
}

function connectWS() {
  if (timeout) clearTimeout(timeout);
  reconnectRetries += 1;
  if (reconnectRetries > MAX_RECONNECT_RETRIES) return;
  try {
    const myWS = new WebSocket(getConfigValue("WS_URL") || "", {
      headers: {
        "perfyll-version": VERSION,
        Authorization: getConfigValue("API_SECRET"),
        "x-api-key": getConfigValue("API_KEY"),
        "instance-id": instanceId,
        "instance-name": getConfigValue("SERVICE") || "",
        country: instanceCountry || "",
      },
    });
    setState({ ws: myWS });
    myWS.on("open", () => console.info("Perfyll stream connected"));
    myWS.on("error", (err) => {
      console.error("Perfyll stream error", err);
      timeout = setTimeout(connectWS, RECONNECT_INTERVAL);
    });
    myWS.on("close", (err) => {
      console.error("Perfyll stream closed", err);
      timeout = setTimeout(connectWS, RECONNECT_INTERVAL);
    });
  } catch {}
}

export const isStreamming = () => ws?.readyState === ws?.OPEN;

export const close = () =>
  ws && (ws as WebSocket)?.readyState === (ws as WebSocket)?.OPEN && (ws as WebSocket)?.close();

export type PerfyllConfigServer = Config;

export const { mark, startMark, endMark, startMarkAsync, endMarkAsync, getHeaders, log, logError } =
  base;
