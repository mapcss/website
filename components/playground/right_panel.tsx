import React, { useMemo } from "react";
import { clsx } from "~/deps.ts";
import { dynamic } from "aleph/react";

type Props = {
  status: "wait" | "success" | "error";
};

const ShadowRoot = dynamic(() => import("~/components/shadow_root.tsx"));

export function Loading(
  { message, className }: Partial<{ message: string; className: string }>,
) {
  return (
    <div className="h-full grid place-items-center">
      <div
        className={clsx(
          "flex flex-col items-center space-y-2",
          className,
        )}
      >
        <span className="i-mdi-loading animate-spin w-12 h-12" />
        <span className="text-xl">{message}</span>
      </div>
    </div>
  );
}

export function Main(
  { children, StyleSheets, shadowClassName }: {
    children: string;
    StyleSheets: CSSStyleSheet;
    shadowClassName?: string;
  },
) {
  return (
    <>
      <ShadowRoot
        mode="closed"
        className="h-full"
        onRender={(root) => {
          if (StyleSheets) {
            (root as any).adoptedStyleSheets = [StyleSheets];
          }
        }}
      >
        <div
          className={clsx("h-full", shadowClassName)}
          dangerouslySetInnerHTML={{ __html: children }}
        />
      </ShadowRoot>
    </>
  );
}
