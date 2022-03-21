import "~/utils/has_own_polyfill.ts";
import { generate } from "@mapcss/core/generate.ts";
import type { ErrorLike, Message } from "~/utils/message.ts";

declare global {
  interface Window {
    importScripts: (...urls: (string | URL)[]) => void;
    __shimport__: {
      load(url: string): Promise<any>;
    };
  }
}

let configCache: [string, object] | undefined;
let importShimCache: ((url: string) => Promise<any>) | undefined;

self.addEventListener(
  "message",
  async (
    { data: { code, rawConfig } }: MessageEvent<
      { code: string; rawConfig: string }
    >,
  ) => {
    const uri = `data:text/javascript;base64,${btoa(rawConfig)}`;

    if (configCache?.[0] === uri) {
      const module = configCache[1];
      const { css } = generate(
        code,
        module ?? {},
      );
      const msg: Message = { type: "content", value: css };
      handleException(() => self.postMessage(msg));
    } else {
      try {
        const importShim = importShimCache
          ? importShimCache
          : await (async () => {
            const isSupported = await isSupportImport();
            const importShim = getImportShim(isSupported);
            importShimCache = importShim;
            return importShim;
          })();

        const module = await importShim(uri);
        const config = module.default ?? {};
        configCache = [uri, config];
        const { css } = generate(
          code,
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

function handleException(fn: () => any): void {
  try {
    fn();
  } catch (e) {
    if (e instanceof Error) {
      const msg: Message = { type: "error", value: toErrorLike(e) };
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
