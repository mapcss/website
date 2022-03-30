export type ProgressMessage = {
  type: "progress";
  value: "init" | "compile" | "import";
  end?: true;
};
export type Message =
  | {
    type: "error";
    value: ErrorLike;
  }
  | { type: "content"; value: { css: string; token: Set<string> | string } }
  | ProgressMessage;

export type ErrorLike = Pick<Error, "message" | "name" | "stack">;
export type Data = {
  input: string;
  config: string;
  version: string;
  css: string;
};
