import ansis from "ansis";
import { WebSocket } from "ws";

const API_REST_URL = "https://ye7mu1sifd.execute-api.us-east-1.amazonaws.com/prod";
const API_WS_URL = "wss://l98b2n29xi.execute-api.us-east-1.amazonaws.com/prod/";
const VERSION = "1.0.0";
const RECONNECT_INTERVAL = 10000;
const MAX_RECONNECT_RETRIES = 2;

let timeout: NodeJS.Timeout;
let instanceId: string;
let instanceCountry: string;
let reconnectRetries = 0;
let ws: WebSocket;
let config: PerfyllConfig = {
  publicKey: "",
  secret: "",
  serviceName: "",
  logTimeline: false,
  forceHttp: false,
};

export type PerfyllConfig = {
  publicKey: string;
  secret?: string;
  serviceName?: string;
  /** It will force a http request, default is false */
  forceHttp?: boolean;
  /** default is false */
  logTimeline?: boolean;
  customHttpUrl?: string;
  customWSUrl?: string;
};

export type ExtraArgs = { user?: string; [key: string]: string | number | boolean | undefined };

export type StartMarkArgs = EndMarkArgs & {
  headers?: Headers;
  repeatable?: boolean;
  mainMark?: string;
};

export type EndMarkArgs = {
  extra?: ExtraArgs;
};

export type MarkPostBody = {
  main: string;
  hash: string;
  marks: [string, number, number, ExtraArgs][];
};

type ErrorLogType = {
  action: "log";
  type: "error";
  date: number;
  extra: ExtraArgs;
  error: {
    name: string;
    message: string;
    stack: string;
  };
};

type LogType = {
  action: "log";
  type: "info";
  date: number;
  extra: ExtraArgs;
  text: string;
};

export type LogPostBody = ErrorLogType | LogType;

const mapMarks: Map<
  string,
  [start: number, end: number, hash: string, main: string, extra: ExtraArgs]
> = new Map();

const HEADER_MARK = "perfyll_mark";
const HEADER_HASH = "perfyll_hash";

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
export function log(text: string, extra: ExtraArgs = {}) {
  return publishLog({
    action: "log",
    type: "info",
    date: Date.now(),
    text,
    extra,
  });
}

/**
 * It logs an error with optional extra args
 * @param error error Object or string
 * @param extra Extra args
 * @returns
 */
export function logError(error: string | Error, extra: ExtraArgs) {
  return publishLog({
    date: Date.now(),
    action: "log",
    type: "error",
    error: {
      message: typeof error === "string" ? error : error.message,
      name: typeof error === "string" ? "Error" : error.name,
      stack: typeof error === "string" ? "" : error.stack || "",
    },
    extra,
  });
}

/**
 * The initialization function, it must be declared outside the function scope.
 * @param conf
 */
export function init(conf: PerfyllConfig) {
  config = Object.assign(config, conf);
  if (typeof window !== "object" && !config.forceHttp) {
    if (instanceId) {
      connectWS();
    } else {
      if (!instanceId) {
        fetchCreateInstance().then((res) => {
          if (res) {
            instanceId = res.instanceId;
            instanceCountry = res.country;
            instanceId && connectWS();
          }
        });
      } else {
        if (!ws || ws.readyState !== ws.OPEN) {
          connectWS();
        }
      }
    }
  }
}

function connectWS() {
  if (timeout) clearTimeout(timeout);
  reconnectRetries += 1;
  if (reconnectRetries > MAX_RECONNECT_RETRIES) return;
  try {
    ws = new WebSocket(config.customWSUrl || API_WS_URL, {
      headers: {
        "perfyll-version": VERSION,
        Authorization: config.secret!,
        "x-api-key": config.publicKey,
        "instance-id": instanceId,
        "instance-name": config.serviceName,
        country: instanceCountry,
      },
    });
    ws.on("open", () => {
      console.log("Perfyll stream connected");
    });
    ws.on("error", () => {
      console.log("Perfyll stream error");
      timeout = setTimeout(connectWS, RECONNECT_INTERVAL);
    });
    ws.on("close", () => {
      console.log("Perfyll stream closed");
      timeout = setTimeout(connectWS, RECONNECT_INTERVAL);
    });
  } catch {}
}

function send(mark: string) {
  return {
    /**
     *
     * @param subMarks (optional) array of subMarks
     * @returns
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

async function postMark(event: MarkPostBody) {
  return fetch(`${config.customHttpUrl || API_REST_URL}/analytics`, {
    method: "POST",
    body: JSON.stringify(event),
    headers: {
      "Content-Type": "application/json",
      "perfyll-version": VERSION,
      "instance-id": instanceId,
      "instance-name": config.serviceName!,
      Authorization: config.secret!,
      "x-api-key": config.publicKey!,
    },
  }).catch(() => {});
}

async function postLog(data: LogPostBody) {
  return fetch(`${config.customHttpUrl || API_REST_URL}/log`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      "perfyll-version": VERSION,
      "instance-id": instanceId,
      "instance-name": config.serviceName!,
      Authorization: config.secret!,
      "x-api-key": config.publicKey!,
    },
  }).catch(() => {});
}

async function fetchCreateInstance() {
  return fetch(`${config.customHttpUrl || API_REST_URL}/instance`, {
    method: "POST",
    body: JSON.stringify({ serviceName: config.serviceName }),
    headers: {
      "Content-Type": "application/json",
      "perfyll-version": VERSION,
      Authorization: config.secret || "",
      "x-api-key": config.publicKey!,
    },
  })
    .then((res) => res.json())
    .catch(() => {});
}

function serializeData(data: MarkPostBody) {
  return JSON.stringify(data);
}

function print(data: MarkPostBody) {
  let full = data.marks[0][2] - data.marks[0][1];
  let result = "";
  for (let i = 0; i < data.marks.length; i++) {
    const mark = data.marks[i];
    const duration = (mark[2] || mark[1]) - mark[1];
    const start = mark[1] - data.marks[0][1];
    const size = Math.ceil((duration / full) * 30);
    const blankSize = Math.ceil((start / full) * 30);
    const restSize = 30 - (blankSize + size);
    const bar = "█"
      .repeat(!size && blankSize ? blankSize - 1 : blankSize)
      .concat(ansis.green("█").repeat(size || 1))
      .concat("█".repeat(!size && restSize ? restSize - 1 : restSize));

    const markName = data.main === mark[0] ? mark[0] : `${data.main} => ${mark[0]}`;
    result += `${markName} = ${ansis.yellow.bold(
      `${mark[2] ? `${duration}ms` : "not finished"}`
    )}\n${bar}\n`;
  }
  console.log(result);
}

function publishEvent(data: MarkPostBody) {
  if (config.logTimeline) {
    print(data);
  }

  if (config.forceHttp || !config.secret) {
    if (config.publicKey) {
      return postMark(data);
    } else {
      console.error("PublicKey not provided");
    }
  } else if (config.secret) {
    if (typeof window !== "undefined") {
      console.error("Do not expose your secret on the client side");
    } else {
      if (ws && ws.readyState === ws.OPEN) {
        setImmediate(() => ws.send(serializeData(data)));
      } else {
        setImmediate(() => postMark(data));
      }
    }
  }
}

function publishLog(data: LogPostBody) {
  if (config.forceHttp || !config.secret) {
    if (config.publicKey) {
      return postLog(data);
    } else {
      console.error("PublicKey not provided");
    }
  } else if (config.secret) {
    if (typeof window !== "undefined") {
      console.error("Do not expose your secret on the client side");
    } else {
      if (ws && ws.readyState === ws.OPEN) {
        setImmediate(() => ws.send(JSON.stringify(data)));
      } else {
        setImmediate(() => postLog(data));
      }
    }
  }
}
