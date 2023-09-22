import * as mqtt from "mqtt";
import { WebSocket } from "ws";
let ws: WebSocket;
let client: mqtt.MqttClient;

export type PerfyllConfig = {
  url?: string;
  token?: string;
  mode: "ws" | "http" | "mqtt";
};

type ExtraArgs = { author?: string; [key: string]: string | undefined };

export type MarkArgs = {
  mark: string;
  mainMark?: string;
  extra?: ExtraArgs;
};

export type MarkPostBody = {
  mainMark: string;
  mainMarkHash: string;
  async?: boolean;
  timeline: [string, number, number, ExtraArgs][];
};

let currentAuthor: string | undefined | null;
let config: PerfyllConfig = {
  url: "http://localhost:4000/test",
  token: "",
  mode: "http",
};

const mapMarks: Map<string, [number, string, string, ExtraArgs]> = new Map(); // [start, hash, main]
const mapSubMarks: Map<string, Array<[number, number, ExtraArgs]>> = new Map(); // [start, end]

const HEADER_MARK = "perfyll_mark";
const HEADER_HASH = "perfyll_hash";

/**
 * @param {MarkArgs | string} data
 * @param {Header} [headers] - Optional headers; they are mandatory in the FIRST Mark in the E2E marks.
 * @returns
 */
export function startMark(data: MarkArgs | string, headers?: Headers) {
  const { mark, extra } = getArgsFromData(data);

  const hash = headers?.get(HEADER_HASH) || generateUUID();
  const main = headers?.get(HEADER_MARK) || mark;
  mapMarks.set(mark, [Date.now(), hash, main, extra]);

  return;
}

export function endMark(data: MarkArgs | string, subMarks?: string[]) {
  const { mark, extra } = getArgsFromData(data);

  if (!mapMarks.has(mark)) return;

  const start = mapMarks.get(mark)![0];
  const mainMarkHash = mapMarks.get(mark)![1];
  const mainMark = mapMarks.get(mark)![2];
  const currentExtra = mapMarks.get(mark)![3];

  let marks: [string, number, number, ExtraArgs][] = [
    [mark, start, Date.now(), Object.assign(currentExtra, extra)],
  ];
  let marksSerialized = `${mark}:${start}:${Date.now()}`;
  if (subMarks) {
    for (let i = 0; i < subMarks.length; i++) {
      const subMark = mapSubMarks.get(subMarks[i]);
      if (!subMark) continue;
      for (let j = 0; j < subMark.length; j++) {
        const occurrence = subMark[j];
        if (occurrence[1] !== 0) {
          marks.push([subMarks[i], occurrence[0], occurrence[1], occurrence[2]]);
          marksSerialized.concat(`|${subMarks[i]}:${occurrence[0]}:${occurrence[1]}`);
        }
        mapSubMarks.delete(subMarks[i]);
      }
    }
  }

  mapMarks.delete(mark);

  marksSerialized = `${mainMark}+${mainMarkHash}+${marksSerialized}`;
  // JSON.stringify({
  //   mainMark,
  //   mainMarkHash,
  //   timeline: marks,
  // });

  if (config.mode === "mqtt") {
    client.publish("test", marksSerialized);
  }

  if (config.mode === "ws") {
    ws.send(
      marksSerialized
      // JSON.stringify({
      //   mainMark,
      //   mainMarkHash,
      //   timeline: marks,
      // })
    );
  }

  if (config.mode === "http") {
    fetchAPI({
      mainMark,
      mainMarkHash,
      timeline: marks,
    });
  }
}

/**
 * Submarks will wait for the main mark to end to be sent to the server in batch
 *
 * @param data
 */
export function startSubMark(data: MarkArgs | string) {
  const { mark, extra } = getArgsFromData(data);

  if (mapSubMarks.has(mark)) {
    mapSubMarks.get(mark)!.push([Date.now(), 0, extra]);
  } else {
    mapSubMarks.set(mark, [[Date.now(), 0, extra]]);
  }
}

/**
 * Submarks will wait for the main mark to end to be sent to the server in batch
 *
 * @param data
 */
export function endSubMark(data: MarkArgs | string) {
  const { mark, extra } = getArgsFromData(data);

  if (mapSubMarks.has(mark)) {
    const last = mapSubMarks.get(mark)!.at(-1);
    if (!last) return;
    last[1] = Date.now();
    last[2] = Object.assign(last[2], extra);
  }
}

export function startMarkAsync(data: MarkArgs | string, headers?: Headers) {
  const args = getArgsFromData(data);
  const mainMark = headers?.get(HEADER_MARK) || args.mainMark || args.mark;
  const mainMarkHash = headers?.get(HEADER_HASH) || mapMarks.get(mainMark)?.[1] || generateUUID();

  const mark: MarkPostBody = {
    mainMark,
    mainMarkHash,
    async: true,
    timeline: [[args.mark, Date.now(), 0, args.extra]],
  };

  return mark;
}

export function endMarkAsync(ref: MarkPostBody, subMarks?: string[]) {
  if (subMarks) {
    for (let i = 0; i < subMarks.length; i++) {
      const subMarksEvents: [string, number, number, ExtraArgs][] | undefined = mapSubMarks
        .get(subMarks[i])
        ?.map((occurrence) => [subMarks[i], occurrence[0], occurrence[1], occurrence[2]]);
      subMarksEvents && ref.timeline.concat(subMarksEvents);
      mapSubMarks.delete(subMarks[i]);
    }
  }
  ref.timeline[0][2] = Date.now();
  return fetchAPI(ref);
}

export function init(conf: PerfyllConfig) {
  config = Object.assign(config, conf);
  if (conf.mode === "ws") {
    ws = new WebSocket("ws://localhost:3000", {});
  } else if (conf.mode === "mqtt") {
    mqtt.connect({
      host: "localhost",
      protocol: "mqtt",
      port: 1883,
    });
  }
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getArgsFromData(data: MarkArgs | string, headers?: Headers) {
  let mark: string;
  let mainMark: string | undefined;
  let extra: ExtraArgs = {};

  if (typeof data === "string") {
    mark = data;
  } else {
    mark = data.mark;
    extra = data.extra || {};
    mainMark = data.mainMark;
  }

  return { mark, mainMark, extra };
}

function fetchAPI(event: MarkPostBody) {
  return fetch(config.url!, {
    method: "POST",
    body: event as any,
    headers: {
      "Content-Type": "application/json",
      Authorization: config.token!,
    },
  }).catch(() => undefined);
}
