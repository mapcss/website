// workaround aleph bundle error, import directly
import { SSRProvider } from "https://deno.land/x/atomic_ui_react@1.0.0-beta.7/mod.ts";
import { FC, useState } from "react";
import {
  DarkModeContext,
  OverlayContext,
  ToastContext,
} from "~/contexts/mod.ts";
import useDarkMode from "~/hooks/use_dark_mode.ts";
import useNode from "~/hooks/use_node.ts";
import "./style/map.css";
import "./style/global.css";
import type { State as ToastState } from "~/hooks/use_toast.ts";
import "~/utils/has_own_polyfill.ts";
export default function App(
  { Page, pageProps }: { Page: FC; pageProps: Record<string, unknown> },
) {
  const [isDark, setDark] = useDarkMode();
  const [node, setNode] = useNode();
  const toastStateSet = useState<ToastState[]>([]);

  return (
    <SSRProvider>
      <head>
        <meta name="viewport" content="width=device-width" />
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="prefetch" href="/worker.js" />
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
    </SSRProvider>
  );
}
