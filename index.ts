// TODO Repeatable AND subMarks to markAsync
import { WebSocket } from "ws";
import kleur from "kleur";

const VERSION = "0.0.1";
const RECONNECT_INTERVAL = 10000;
const MAX_RECONNECT_RETRIES = 5;
let reconnectRetries = 0;

let ws: WebSocket;
let config: PerfyllConfig = {
  url: "",
  apiKey: "",
  secret: "",
  log: true,
  offline: false,
};

export type PerfyllConfig = {
  url?: string;
  apiKey?: string;
  secret?: string;
  /** default is true */
  log?: boolean;
  /** default is false */
  offline?: boolean;
};

export type MarkExtraArgs = { author?: string; [key: string]: string | undefined };

export type StartMarkArgs = EndMarkArgs & {
  headers?: Headers;
  repeatable?: boolean;
};

export type EndMarkArgs = {
  mark: string;
  extra?: MarkExtraArgs;
};

export type MarkPostBody = {
  main: string;
  hash: string;
  marks: [string, number, number, MarkExtraArgs][];
};

// [start, end, hash, main, extra]
const mapMarks: Map<string, [number, number, string, string, MarkExtraArgs]> = new Map();
// [[start, end, extra]]
// const repeatableMarks: Map<string, [number, number, MarkExtraArgs][]> = new Map();

const HEADER_MARK = "perfyll_mark";
const HEADER_HASH = "perfyll_hash";

/**
 * @param {StartMarkArgs | string} data
 * @returns
 */
export function startMark(data: StartMarkArgs | string) {
  const { mark, extra, headers } = getArgsFromData(data);

  const hash = headers?.get(HEADER_HASH) || "";
  const main = headers?.get(HEADER_MARK) || mark;
  mapMarks.set(mark, [Date.now(), 0, hash, main, extra]);

  return;
}

export function endMark(data: EndMarkArgs | string, subMarks?: string[]) {
  const { mark, extra } = getArgsFromData(data);

  const markRef = mapMarks.get(mark)!;
  if (!markRef) return;

  const start = markRef[0];
  const hash = markRef[2] || generateUUID();
  const main = markRef[3];
  const currentExtra = markRef[4];

  if (!subMarks) {
    markRef[1] = Date.now();
    return;
  }

  let marks: [string, number, number, MarkExtraArgs][] = [
    [mark, start, Date.now(), Object.assign(currentExtra, extra)],
  ];

  for (let i = 0; i < subMarks.length; i++) {
    const subMarkName = subMarks[i];
    const subMark = mapMarks.get(subMarkName)!;
    if (!subMark) continue;
    marks.push([subMarkName, subMark[0], subMark[1], subMark[4]]);
    mapMarks.delete(subMarkName);
  }

  mapMarks.delete(mark);

  return publishEvent({
    main,
    hash,
    marks,
  });
}

export function markOnly(data: StartMarkArgs | string, send = false) {
  const args = getArgsFromData(data);
  const main = args.headers?.get(HEADER_MARK) || args.mark;
  const currentMainMark = mapMarks.get(main);
  if (currentMainMark && !currentMainMark[2]) {
    currentMainMark[2] = generateUUID();
  }
  const hash = args.headers?.get(HEADER_HASH) || currentMainMark?.[2] || generateUUID();
  const now = Date.now();

  if (send) {
    return publishEvent({
      main,
      hash,
      marks: [[args.mark, now, now, args.extra]],
    });
  } else {
    mapMarks.set(args.mark, [now, now, main, hash, args.extra]);
  }
}

export function startMarkAsync(data: StartMarkArgs | string, mainMark?: string) {
  const args = getArgsFromData(data);
  let main = args.headers?.get(HEADER_MARK) || mainMark || args.mark;
  const currentMainMark = mapMarks.get(main);
  if (currentMainMark && !currentMainMark[2]) {
    currentMainMark[2] = generateUUID();
  }
  if (currentMainMark) {
    main = currentMainMark[3];
  }
  const hash = args.headers?.get(HEADER_HASH) || currentMainMark?.[2] || generateUUID();

  const mark: MarkPostBody = {
    main,
    hash,
    marks: [[args.mark, Date.now(), 0, args.extra]],
  };

  if (mainMark) {
    mapMarks.set(args.mark, [Date.now(), 0, hash, main, args.extra]);
  }

  return mark;
}

export function endMarkAsync(ref: MarkPostBody) {
  ref.marks[0][2] = Date.now();
  return publishEvent(ref);
}

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

let timeout: NodeJS.Timeout;

function connectWS() {
  if (timeout) clearTimeout(timeout);
  reconnectRetries += 1;
  if (reconnectRetries > MAX_RECONNECT_RETRIES) return;
  try {
    ws = new WebSocket(config.url!, {
      headers: {
        "perfyll-version": VERSION,
        Authorization: config.secret! || "",
        "x-api-key": config.apiKey,
      },
    });
    ws.on("open", () => console.log("Perfyll analytics stream connected"));
    ws.on("error", (...args) => {
      console.log("error", args);
      timeout = setTimeout(connectWS, RECONNECT_INTERVAL);
    });
    ws.on("close", (...args) => {
      console.log("close", args);
      timeout = setTimeout(connectWS, RECONNECT_INTERVAL);
    });
  } catch {}
}

export function init(conf: PerfyllConfig) {
  config = Object.assign(config, conf);
  if (conf.url?.startsWith("ws")) connectWS();
}

function generateUUID() {
  return `${performance.timeOrigin}_${process.pid || ""}_${performance.now() || ""}`;
}

function getArgsFromData(data: StartMarkArgs | string) {
  let mark: string;
  let extra: MarkExtraArgs = {};
  let headers: Headers | undefined;

  if (typeof data === "string") {
    return { mark: data, extra: {} };
  } else {
    mark = data.mark;
    extra = data.extra || {};
    headers = data.headers;
  }

  return { mark, extra, headers };
}

function fetchAPI(event: MarkPostBody) {
  return fetch(config.url!, {
    method: "POST",
    body: JSON.stringify(event),
    headers: {
      "Content-Type": "application/json",
      "perfyll-version": VERSION,
      Authorization: config.secret || "",
      "x-api-key": config.apiKey!,
    },
  });
}

function serializeData(data: MarkPostBody) {
  return JSON.stringify(data);
}

function log(data: MarkPostBody) {
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
      .concat(kleur.green("█").repeat(size || 1))
      .concat("█".repeat(!size && restSize ? restSize - 1 : restSize));

    const markName = data.main === mark[0] ? mark[0] : `${data.main} => ${mark[0]}`;
    result += `${markName} = ${kleur
      .yellow()
      .bold(`${mark[2] ? `${duration}ms` : "not finished"}`)}\n${bar}\n`;
  }
  console.log(result);
}

function publishEvent(data: MarkPostBody) {
  if (config.log) {
    process.env.NODE_ENV === "test" ? log(data) : setImmediate(() => log(data));
  }

  if (!config.offline && config.url) {
    if (config.url.startsWith("ws")) {
      if (ws && ws.readyState === ws.OPEN) {
        setImmediate(() => ws.send(serializeData(data)));
      }
    } else {
      process.env.NODE_ENV === "test" ? fetchAPI(data) : setImmediate(() => fetchAPI(data));
    }
  }
}
