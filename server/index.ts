import { WebSocket } from "ws";
import { fetcher, config, init as frontInit, instanceId, ws, setState } from "../methods";
import { PerfyllConfigServer as Config } from "../types";

const API_WS_URL = "wss://wsapi.perfyllapp.com";
const VERSION = "1.0.0";
const RECONNECT_INTERVAL = 10000;
const MAX_RECONNECT_RETRIES = 2;

let timeout: ReturnType<typeof setTimeout>;
let instanceCountry: string;
let reconnectRetries = 0;

async function createInstance() {
  return fetcher("/instance", { serviceName: config.serviceName! }).then((res) => res!.json());
}

/**
 * The initialization function, it must be declared outside the function scope.
 * @param conf
 */
export function initServer(conf: Config) {
  frontInit(conf);
  const shouldConnect = !config.forceHttp && (!ws || ws.readyState !== ws.OPEN);
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
    const myWS = new WebSocket(config.customWSUrl || API_WS_URL, {
      headers: {
        "perfyll-version": VERSION,
        Authorization: config.secret!,
        "x-api-key": config.publicKey,
        "instance-id": instanceId,
        "instance-name": config.serviceName,
        country: instanceCountry,
      },
    });
    setState({ ws: myWS });
    myWS.on("open", () => console.log("Perfyll stream connected"));
    myWS.on("error", () => {
      console.log("Perfyll stream error");
      timeout = setTimeout(connectWS, RECONNECT_INTERVAL);
    });
    myWS.on("close", () => {
      console.log("Perfyll stream closed");
      timeout = setTimeout(connectWS, RECONNECT_INTERVAL);
    });
  } catch {}
}

export type PerfyllConfigServer = Config;
