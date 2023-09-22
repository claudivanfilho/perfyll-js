export type PerfyllConfig = {
  url: string;
  token: string;
  errorCB?: (err: Error) => any;
};

export type TrackArgs = {
  action: string;
  /** the identifier of the entire action, it can be the userId in the context */
  author?: string;
};

export type SimpleAction = {
  mainAction: string;
  actionHash: string;
  author?: string;
  async?: boolean;
  actions: [string, number, number][];
};

let currentAct: SimpleAction | undefined;
let config: PerfyllConfig = {
  url: "http://localhost:3000",
  token: "",
  errorCB: () => undefined,
};
const mapActions: Map<string, SimpleAction> = new Map();

const HEADER_ACTION = "perfyll_action";
const HEADER_HASH = "perfyll_hash";

/**
 * @param {TrackArgs | string} data
 * @param {Header} [headers] - Optional headers; they are mandatory in the FIRST TRACK for full-stack actions.
 * @returns
 */
export function startTrack(data: TrackArgs | string, headers?: Headers) {
  const { action, author } = getArgsFromData(data);

  if (!currentAct) {
    const mainAction = headers?.get(HEADER_ACTION) || action;
    const actionHash = headers?.get(HEADER_HASH) || generateUUID();
    currentAct = {
      mainAction,
      actionHash,
      author,
      actions: [[action, Date.now(), 0]],
    };
    return;
  }

  currentAct.actions.push([action, Date.now(), 0]);
}

export function endTrack(action: string) {
  if (!currentAct) return;

  const found = currentAct.actions.find((act: [string, number, number]) => act[0] === action);

  if (found) {
    found[2] = Date.now();
    if (!currentAct.actions.some((act) => act[2] === 0)) {
      fetchAPI(currentAct);
      currentAct = undefined;
    }
  }
}

/**
 * @param {TrackArgs | string} data
 * @param {Header} [headers] - Optional headers; they are mandatory in the FIRST TRACK for full-stack actions.
 * @returns The chained promise
 */
export function trackAsyncPromise<T>(data: TrackArgs | string, headers?: Headers) {
  return genericTrackPromise<T>(getArgsFromData(data), headers, true);
}

/**
 * @param {TrackArgs | string} data
 * @param {Header} [headers] - Optional headers; they are mandatory in the FIRST TRACK for full-stack actions.
 * @returns The chained promise
 */
export function trackPromise<T>(data: TrackArgs | string, headers?: Headers) {
  return genericTrackPromise<T>(getArgsFromData(data), headers);
}

export function startTrackE2E(action: string) {
  const hash = generateUUID();
  const id = `${hash}:${Date.now()}`;
  return [id, { [HEADER_ACTION]: action, [HEADER_HASH]: hash }];
}

export function endTrackE2E({ action, author }: { action: string; author?: string }, id: string) {
  const [actionHash, start] = id.split(":");
  fetchAPI({
    actionHash,
    mainAction: action,
    author,
    actions: [[action, +start, Date.now()]],
  });
}

/**
 *
 * @param routes e.g [{myaction: ["/teste/[0-9]+/?$", "POST"]}]
 */
export function trackE2E(routes: { [path: string]: [string, string] }) {
  // @ts-ignore
  const originalFetch = window.fetch;
  // @ts-ignore
  window.fetch = async (url, options) => {
    const found = Object.entries(routes).find(
      (val) => url.toString().match(val[1][0]) && (options?.method || "GET") === val[1][1]
    );

    if (!found) return originalFetch(url, options);

    const mainAction = found[0];
    const actionHash = generateUUID();
    const start = Date.now();

    return originalFetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        [HEADER_ACTION]: mainAction,
        [HEADER_HASH]: actionHash,
      },
    }).finally(() => {
      fetchAPI({
        actionHash,
        mainAction,
        actions: [[mainAction, start, Date.now()]],
      }).catch(config.errorCB);
    });
  };
}

export function init(conf: PerfyllConfig) {
  config = { ...config, ...conf };
}

function genericTrackPromise<T>({ action, author }: TrackArgs, headers?: Headers, async?: boolean) {
  const mainAction = headers?.get(HEADER_ACTION) || currentAct?.mainAction || action;
  const actionHash = headers?.get(HEADER_HASH) || currentAct?.actionHash || generateUUID();

  const newEvent: SimpleAction = {
    actionHash,
    mainAction,
    author: currentAct?.author || author,
    actions: [],
    async,
  };

  const start = Date.now();

  return (res: T) => {
    newEvent.actions.push([action, start, Date.now()]);
    fetchAPI(newEvent);
    return Promise.resolve(res as T);
  };
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getArgsFromData(data: TrackArgs | string, headers?: Headers) {
  let action: string;
  let author: string | undefined;

  if (typeof data === "string") {
    action = data;
  } else {
    action = data.action;
    author = data.author;
  }

  return { action, author };
}

function fetchAPI(event: SimpleAction) {
  return fetch(config.url, {
    method: "POST",
    body: event as any,
    headers: {
      "Content-Type": "application/json",
      Authorization: config.token,
    },
  })
    .then()
    .catch(config.errorCB);
}
