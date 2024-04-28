export type PerfyllConfigServer = PerfyllConfig & {
  serviceName?: string;
  secret?: string;
  customWSUrl?: string;
};

export type PerfyllConfig = {
  publicKey?: string;
  forceHttp?: boolean;
  customHttpUrl?: string;
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

export type CreateInstancePostBody = {
  serviceName: string;
};

export type ErrorLogType = {
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

export type LogType = {
  action: "log";
  type: "info";
  date: number;
  extra: ExtraArgs;
  text: string;
};

export type LogPostBody = ErrorLogType | LogType;
