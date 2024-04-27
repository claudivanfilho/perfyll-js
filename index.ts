import * as methods from "./methods";
import { PerfyllConfig as Config } from "./types";

export const {
  init,
  mark,
  startMark,
  endMark,
  startMarkAsync,
  endMarkAsync,
  getHeaders,
  log,
  logError,
} = methods;

// export const { initServer } = serverMethods;

export type PerfyllConfig = Config;
// export type PerfyllConfigServer = ConfigServer;
