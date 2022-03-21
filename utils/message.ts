export type Message = {
  type: "error";
  value: ErrorLike;
} | { type: "content"; value: string };

export type ErrorLike = Pick<Error, "message" | "name" | "stack">;
