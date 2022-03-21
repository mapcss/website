export type Message = {
  type: "error";
  value: Error;
} | { type: "content"; value: string };
