import React from "react";
import { clsx } from "~/deps.ts";
import type { ErrorLike } from "~/utils/message.ts";

export type Props = {
  e: ErrorLike;
} & JSX.IntrinsicElements["div"];
export default function Err({ e, className, ...rest }: Props): JSX.Element {
  return (
    <div
      className={clsx(
        "p-4 bg-gradient-to-br from-white to-red-900 dark:from-dark-900",
        className,
      )}
      {...rest}
    >
      <h2 className="space-x-2">
        <span className="i-mdi-alert w-5 h-5 text-red-800" />
        <span className="text-red-800 font-bold">{e.name}</span>
      </h2>
      <code className="text-red-700">
        {e.message}
      </code>
    </div>
  );
}
