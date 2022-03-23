import "~/utils/has_own_polyfill.ts";
import { extractSimple, generate } from "@mapcss/core/mod.ts";
import initSWC, { transformSync } from "https://esm.sh/@swc/wasm-web@1.2.160";
import { isString } from "~/deps.ts";

import { transformOption } from "~/utils/swcrc.ts";
import type { ErrorLike, Message, ProgressMessage } from "~/utils/message.ts";

declare global {
  interface Window {
    importScripts: (...urls: (string | URL)[]) => void;
    __shimport__: {
      load(url: string): Promise<any>;
    };
  }
}

let configCache:
  | { ts: string; js: string; uri: string; mod: object }
  | undefined;
let importShimCache: ((url: string) => Promise<any>) | undefined;
let initializedSWC: boolean = false;

self.addEventListener(
  "message",
  async (
    { data: { code, rawConfig } }: MessageEvent<
      { code: string; rawConfig: string }
    >,
  ) => {
    if (!initializedSWC) {
      const msg: ProgressMessage = { type: "progress", value: "init" };
      const { start, end } = makeRoundTripMsg(msg);
      handleException(start);
      await initSWC("https://esm.sh/@swc/wasm-web/wasm_bg.wasm");
      handleException(end);
      initializedSWC = true;
    }

    const tokens = extractSimple(code);

    if (configCache?.ts === rawConfig) {
      const module = configCache.mod;
      const { css } = generate(
        tokens,
        module,
      );
      const msg: Message = { type: "content", value: css };
      handleException(() => self.postMessage(msg));
    } else {
      try {
        const { start, end } = makeRoundTripMsg({
          type: "progress",
          value: "compile",
        });
        start();
        handleException(start);
        const transpileResult = handleException(() =>
          transformSync(rawConfig, transformOption)
        ) as { code: string } | undefined;

        handleException(end);
        if (!transpileResult) return;
        const { start: startMsg, end: endMsg } = makeRoundTripMsg({
          type: "progress",
          value: "import",
        });
        handleException(startMsg);

        const importShim = importShimCache
          ? importShimCache
          : await (async () => {
            const isSupported = await isSupportImport();
            const importShim = getImportShim(isSupported);
            importShimCache = importShim;
            return importShim;
          })();
        const uri = `data:text/javascript;base64,${btoa(transpileResult.code)}`;

        const module = await importShim(uri);
        handleException(endMsg);

        const config = module.default ?? {};
        configCache = {
          ts: rawConfig,
          js: transpileResult.code,
          uri,
          mod: config,
        };
        const { css } = generate(
          tokens,
          config,
        );
        const msg: Message = { type: "content", value: css };

        handleException(() => self.postMessage(msg));
      } catch (e) {
        if (e instanceof Error) {
          const msg: Message = { type: "error", value: toErrorLike(e) };

          handleException(() => self.postMessage(msg));
        }
      }
    }
  },
);

function toErrorLike({ name, message, stack }: Error): ErrorLike {
  return {
    name,
    message,
    stack,
  };
}

function handleException(fn: () => any): unknown {
  try {
    return fn();
  } catch (e) {
    if (e instanceof Error) {
      const msg: Message = { type: "error", value: toErrorLike(e) };
      self.postMessage(msg);
    } else if (isString(e)) {
      const msg: Message = {
        type: "error",
        value: { message: e, name: "compile error", stack: e },
      };
      self.postMessage(msg);
    } else {
      const msg: Message = {
        type: "error",
        value: toErrorLike(Error("unknown error")),
      };
      self.postMessage(msg);
    }
  }
}

async function isSupportImport(): Promise<boolean> {
  try {
    await (0, eval)('import("")');
    return true;
  } catch (e) {
    if (e instanceof TypeError) {
      return true;
    }
    return false;
  }
}

function getImportShim(
  isSupportImport: boolean,
): (url: string) => Promise<any> {
  if (isSupportImport) {
    return (url: string) => import(url);
  } else {
    self.importScripts("https://unpkg.com/shimport@2.0.5/index.js");
    return self.__shimport__.load;
  }
}

function makeRoundTripMsg(
  startMsg: ProgressMessage,
): { start: () => void; end: () => void } {
  const endMsg: ProgressMessage = { ...startMsg, end: true };
  return {
    start: () => self.postMessage(startMsg),
    end: () => self.postMessage(endMsg),
  };
}
