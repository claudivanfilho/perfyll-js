import {
  CreateInstancePostBody,
  EndMarkArgs,
  ExtraArgs,
  LogPostBody,
  MarkPostBody,
  PerfyllConfig,
  PerfyllConfigServer,
  StartMarkArgs,
} from "./types";

const API_REST_URL = "https://restapi.perfyllapp.com";
const API_WS_URL = "wss://wsapi.perfyllapp.com";
const MAX_ERROR_STACK_LENGTH = 5;
const VERSION = "1.0.0";
const HEADER_MARK = "perfyll_mark";
const HEADER_HASH = "perfyll_hash";
const mapMarks: Map<
  string,
  [start: number, end: number, hash: string, main: string, extra: ExtraArgs]
> = new Map();

export let instanceId: string;
export let config: PerfyllConfigServer = { publicKey: "" };
export let ws: any;
let errorMessageDisplayed = false;

export function setState(args: { ws?: any; instanceId?: string }) {
  if (args.ws) ws = args.ws;
  if (args.instanceId) instanceId = args.instanceId;
}

/**
 * @param {string} mark e.g. productClick, productDBQuery, registerUser, ...
 * @param {StartMarkArgs} args
 * @returns
 */
export function startMark(mark: string, args?: StartMarkArgs) {
  const { extra, headers } = args || {};

  const hash = headers?.get(HEADER_HASH) || "";
  const main = headers?.get(HEADER_MARK) || mark;
  mapMarks.set(mark, [Date.now(), 0, hash, main, extra || {}]);

  return;
}

/**
 * It ends the markation, you must invoke .send() method after to send the mark to the Cloud.
 * @param mark
 * @param data
 * @returns
 */
export function endMark(mark: string, data?: EndMarkArgs) {
  const extra = data?.extra;
  const markRef = mapMarks.get(mark)!;
  if (markRef) {
    markRef[1] = Date.now();
    markRef[4] = Object.assign(markRef[4], extra);
  }
  return send(mark);
}

/**
 *
 * It creates a mark, you must invoke .send() method after to send the mark to the Cloud.
 * @param mark
 * @param data
 * @returns
 */
export function mark(mark: string, data?: StartMarkArgs) {
  const { headers, extra } = data || {};
  const main = headers?.get(HEADER_MARK) || mark;
  const currentMainMark = mapMarks.get(main);
  if (currentMainMark && !currentMainMark[2]) {
    currentMainMark[2] = generateUUID();
  }
  const hash = headers?.get(HEADER_HASH) || currentMainMark?.[2] || generateUUID();
  const now = Date.now();
  mapMarks.set(mark, [now, now, hash, main, extra || {}]);

  return send(mark);
}

/**
 * It is used to mark asynchronous code like a sendEmail event.
 * @param mark
 * @param data
 * @returns a mark reference to be passed to the endMarkAsync.
 */
export function startMarkAsync(mark: string, data?: StartMarkArgs) {
  const { headers, extra = {}, mainMark } = data || {};
  let main = headers?.get(HEADER_MARK) || mainMark || mark;
  const currentMainMark = mapMarks.get(main);
  if (currentMainMark && !currentMainMark[2]) {
    currentMainMark[2] = generateUUID();
  }
  if (currentMainMark) {
    main = currentMainMark[3];
  }
  const hash = headers?.get(HEADER_HASH) || currentMainMark?.[2] || generateUUID();

  const markBody: MarkPostBody = {
    main,
    hash,
    marks: [[mark, Date.now(), 0, extra]],
  };

  if (mainMark) {
    mapMarks.set(mark, [Date.now(), 0, hash, main, extra]);
  }

  return markBody;
}

/**
 * It ends the markation and instantly send the mark to the Cloud.
 * @param ref the reference returned by startMarkAsync
 * @returns
 */
export function endMarkAsync(ref: MarkPostBody) {
  ref.marks[0][2] = Date.now();
  publishEvent(ref);
}

/**
 * It is used to generate the header the E2E markations.
 * The headers used are: **perfyll_mark** and **perfyll_hash**.
 * You must enable these headers in your cors configuration (**Access-Control-Allow-Headers**).
 * @param mark
 * @returns
 */
export function getHeaders(mark: string) {
  if (mapMarks.get(mark)) {
    const uuid = mapMarks.get(mark)![2] || generateUUID();
    mapMarks.get(mark)![2] = uuid;
    return {
      [HEADER_HASH]: uuid,
      [HEADER_MARK]: mark,
    };
  }
  console.error(`The mark ${mark} must be started before this call`);
}

/**
 * It logs a text with optional extra args
 * @param text Info text
 * @param extra Extra args
 * @returns
 */
export function log(text: string, extra?: ExtraArgs) {
  return publishLog({
    action: "log",
    type: "info",
    date: Date.now(),
    text,
    extra: extra || {},
  });
}

/**
 * It logs an error with optional extra args
 * @param error error Object or string
 * @param extra Extra args
 */
export function logError(error: string | Error | unknown, extra?: ExtraArgs) {
  const errorCasted: string | Error = error as any;
  const isStr = typeof errorCasted === "string";
  return publishLog({
    date: Date.now(),
    action: "log",
    type: "error",
    error: {
      message: isStr ? errorCasted : errorCasted?.message,
      name: isStr ? "Error" : errorCasted?.name,
      stack:
        (!isStr && errorCasted.stack?.split("\n")?.slice(1, MAX_ERROR_STACK_LENGTH).join("\n")) ||
        "",
    },
    extra: extra || {},
  });
}

/**
 * The initialization function, it must be declared outside the function scope.
 * @param conf
 */
export function init(conf: PerfyllConfig) {
  config = Object.assign(config, conf);
}

function validateConfig() {
  if (!getConfigValue("API_KEY")) {
    if (!errorMessageDisplayed) {
      console.error(
        "Perfyll Error: you should call the ini|initServer function with a public key or define a .env var"
      );
      errorMessageDisplayed = true;
    }
    return;
  }
  return true;
}

function generateUUID() {
  if (typeof window === "object") {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  return `${performance.timeOrigin}_${process.pid || ""}_${performance.now() || ""}`;
}

function send(mark: string) {
  return {
    /**
     * @param subMarks (optional) array of subMarks
     */
    send(subMarks?: string[]) {
      const markRef = mapMarks.get(mark)!;
      const start = markRef[0];
      const end = markRef[1];
      const hash = markRef[2] || generateUUID();
      const main = markRef[3];
      const currentExtra = markRef[4];

      let marks: [string, number, number, ExtraArgs][] = [[mark, start, end, currentExtra]];

      if (subMarks) {
        for (let i = 0; i < subMarks.length; i++) {
          const subMarkName = subMarks[i];
          const subMark = mapMarks.get(subMarkName)!;
          if (!subMark) continue;
          marks.push([subMarkName, subMark[0], subMark[1], subMark[4]]);
          mapMarks.delete(subMarkName);
        }
      }

      mapMarks.delete(mark);

      return publishEvent({
        main,
        hash,
        marks,
      });
    },
  };
}

export function getConfigValue(
  val: "API_URL" | "WS_URL" | "FORCE_HTTP" | "API_KEY" | "API_SECRET" | "SERVICE"
) {
  const isNotNode = typeof process === "undefined";
  const env = isNotNode ? {} : process.env;
  if (val === "API_URL")
    return (
      config.customHttpUrl ||
      env.VITE_APP_PERFYLL_CUSTOM_API_URL ||
      env.NEXT_PUBLIC_PERFYLL_CUSTOM_API_URL ||
      env.PERFYLL_CUSTOM_API_URL ||
      API_REST_URL
    );
  if (val === "WS_URL") return config.customWSUrl || env.PERFYLL_CUSTOM_WS_URL || API_WS_URL;
  if (val === "FORCE_HTTP") return (config.forceHttp && "true") || env.PERFYLL_FORCE_HTTP;
  if (val === "API_KEY")
    return (
      config.publicKey ||
      env.VITE_APP_PERFYLL_PUBLIC_KEY ||
      env.NEXT_PUBLIC_PERFYLL_PUBLIC_KEY ||
      env.PERFYLL_PUBLIC_KEY
    );
  if (val === "API_SECRET") return config.secret || env.PERFYLL_SECRET;
  if (val === "SERVICE") return config.serviceName || env.PERFYLL_SERVICE_NAME;
}

export async function fetcher(
  path: string,
  data: MarkPostBody | LogPostBody | CreateInstancePostBody
) {
  return fetch(`${getConfigValue("API_URL")}${path}`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      "perfyll-version": VERSION,
      "instance-id": instanceId || "",
      "instance-name": getConfigValue("SERVICE") || "",
      Authorization: getConfigValue("API_SECRET") || "",
      "x-api-key": getConfigValue("API_KEY") || "",
    },
  }).catch(() => {});
}

function publish(path: string, data: MarkPostBody | LogPostBody) {
  if (!validateConfig()) return;

  if (getConfigValue("FORCE_HTTP") || !getConfigValue("API_SECRET")) {
    if (getConfigValue("API_KEY")) return fetcher(path, data);
  } else if (getConfigValue("API_SECRET")) {
    if (typeof window !== "undefined") {
      console.error("Perfyll error: Do not expose your secret on the client side");
    } else {
      if (ws && ws.readyState === ws.OPEN) {
        setImmediate(() => ws.send(JSON.stringify(data)));
      } else {
        setImmediate(() => fetcher(path, data));
      }
    }
  }
}

function publishEvent(data: MarkPostBody) {
  return publish("/analytics", data);
}

function publishLog(data: LogPostBody) {
  return publish("/log", data);
}
