export type ProgressMessage = {
  type: "progress";
  value: "compile" | "import";
  end?: true;
};
export type Message =
  | {
    type: "error";
    value: ErrorLike;
  }
  | { type: "content"; value: string }
  | ProgressMessage;

export type ErrorLike = Pick<Error, "message" | "name" | "stack">;
