import React, { FC, useState } from "react";
import {
  DarkModeContext,
  OverlayContext,
  ToastContext,
} from "~/contexts/mod.ts";
import useDarkMode from "~/hooks/use_dark_mode.ts";
import useNode from "~/hooks/use_node.ts";
import "./style/map.css";
import type { State as ToastState } from "~/hooks/use_toast.ts";

export default function App(
  { Page, pageProps }: { Page: FC; pageProps: Record<string, unknown> },
) {
  const [isDark, setDark] = useDarkMode();
  const [node, setNode] = useNode();
  const toastStateSet = useState<ToastState[]>([]);

  return (
    <>
      <head>
        <meta name="viewport" content="width=device-width" />
        <meta charSet="utf-8" />
      </head>

      <DarkModeContext.Provider value={[isDark, setDark]}>
        <OverlayContext.Provider value={[node, setNode]}>
          <ToastContext.Provider value={toastStateSet}>
            <Page {...pageProps} />
          </ToastContext.Provider>
        </OverlayContext.Provider>
      </DarkModeContext.Provider>

      {node}
      {toastStateSet[0].map(({ node, id }) => (
        <div role="alert" key={id}>{node}</div>
      ))}
    </>
  );
}
