// TODO Repeatable AND subMarks to markAsync
import { WebSocket } from "ws";
import kleur from "kleur";

// send in the headers
const VERSION = "0.0.1";

let ws: WebSocket;
let config: PerfyllConfig = {
  url: "",
  secret: "",
  token: "",
  log: true,
  offline: false,
};

export type PerfyllConfig = {
  url?: string;
  token?: string;
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
  mainMark: string;
  mainMarkHash: string;
  fromClient?: boolean;
  async?: boolean;
  marks: [string, number, number, MarkExtraArgs][];
};

// [start, end, hash, main, extra]
const mapMarks: Map<string, [number, number, string, string, MarkExtraArgs]> = new Map();
// [[start, end, extra]]
// const repeatableMarks: Map<string, [number, number, MarkExtraArgs][]> = new Map();

const HEADER_MARK = "perfyll_mark";
const HEADER_HASH = "perfyll_hash";

/**
 * @param {MarkArgs | string} data
 * @param {Header} [headers] - Optional headers; they are mandatory in the FIRST Mark in the E2E marks.
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
  const mainMarkHash = markRef[2] || generateUUID();
  const mainMark = markRef[3];
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
    mainMark,
    mainMarkHash,
    marks,
  });
}

export function markOnly(data: StartMarkArgs | string, send = false) {
  const args = getArgsFromData(data);
  const newMainMark = args.headers?.get(HEADER_MARK) || args.mark;
  const currentMainMark = mapMarks.get(newMainMark);
  if (currentMainMark && !currentMainMark[2]) {
    currentMainMark[2] = generateUUID();
  }
  const mainMarkHash = args.headers?.get(HEADER_HASH) || currentMainMark?.[2] || generateUUID();
  const now = Date.now();

  if (send) {
    return publishEvent({
      mainMark: newMainMark,
      mainMarkHash,
      marks: [[args.mark, now, now, args.extra]],
    });
  } else {
    mapMarks.set(args.mark, [now, now, newMainMark, mainMarkHash, args.extra]);
  }
}

export function startMarkAsync(data: StartMarkArgs | string, mainMark?: string) {
  const args = getArgsFromData(data);
  const newMainMark = args.headers?.get(HEADER_MARK) || mainMark || args.mark;
  const currentMainMark = mapMarks.get(newMainMark);
  if (currentMainMark && !currentMainMark[2]) {
    currentMainMark[2] = generateUUID();
  }
  const mainMarkHash = args.headers?.get(HEADER_HASH) || currentMainMark?.[2] || generateUUID();

  const mark: MarkPostBody = {
    mainMark: newMainMark,
    mainMarkHash,
    async: true,
    marks: [[args.mark, Date.now(), 0, args.extra]],
  };

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

export function init(conf: PerfyllConfig) {
  config = Object.assign(config, conf);
  if (conf.url?.startsWith("ws://")) {
    ws = new WebSocket(conf.url, { headers: { "perfyll-version": VERSION } });
  }
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
      Authorization: config.token!,
    },
  });
}

function serializeData(data: MarkPostBody) {
  return JSON.stringify(data);
}

function log(data: MarkPostBody) {
  let full = data.marks[0][2] - data.marks[0][1];
  let result = "";
  data.marks.forEach((mark) => {
    const duration = mark[2] - mark[1];
    const start = mark[1] - data.marks[0][1];
    const size = Math.ceil((duration / full) * 30);
    const blankSize = Math.ceil((start / full) * 30);
    const restSize = 30 - (blankSize + size);

    const bar = "█"
      .repeat(!size && blankSize ? blankSize - 1 : blankSize)
      .concat(kleur.green("█").repeat(size || 1))
      .concat("█".repeat(!size && restSize ? restSize - 1 : restSize));

    const markName = data.mainMark === mark[0] ? mark[0] : `${data.mainMark} => ${mark[0]}`;
    result += `${markName} = ${kleur.yellow().bold(`${duration}ms`)}\n${bar}\n`;
  });
  console.log(result);
}

function publishEvent(data: MarkPostBody) {
  if (config.log) {
    process.env.NODE_ENV === "test" ? log(data) : setImmediate(() => log(data));
  }

  if (!config.offline && config.url) {
    if (config.url.startsWith("ws://")) {
      setImmediate(() => ws.send(serializeData(data)));
    } else {
      process.env.NODE_ENV === "test" ? fetchAPI(data) : setImmediate(() => fetchAPI(data));
    }
  }
}
