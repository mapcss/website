export type Message =
  | {
    type: "error";
    value: ErrorLike;
  }
  | { type: "content"; value: string }
  | {
    type: "progress";
    value: "compile" | "import";
  };

export type ErrorLike = Pick<Error, "message" | "name" | "stack">;
