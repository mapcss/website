import "~/utils/has_own_polyfill.ts";
import { isConfigModule } from "@mapcss/config/mod.ts";
import { applyExtractor, Config, generate as g } from "@mapcss/core/mod.ts";
import initSWC, { transformSync } from "https://esm.sh/@swc/wasm-web@1.2.160";
import { isString } from "~/deps.ts";

import { transformOption } from "~/utils/swcrc.ts";
import type {
  Data,
  ErrorLike,
  Message,
  ProgressMessage,
} from "~/utils/message.ts";

declare global {
  interface Window {
    importScripts: (...urls: (string | URL)[]) => void;
    __shimport__: {
      load(url: string): Promise<any>;
    };
  }
}

type ImportShim = (url: string) => Promise<any>;

let configCache:
  | { ts: string; js: string; uri: string; mod: Config }
  | undefined;
const versionCache: Set<string> = new Set();
let initializedSWC: boolean = false;

self.addEventListener(
  "message",
  async (
    { data: { input, config, version, css } }: MessageEvent<
      Data
    >,
  ) => {
    try {
      if (!initializedSWC) {
        const msg: ProgressMessage = { type: "progress", value: "init" };
        const { start, end } = makeRoundTripMsg(msg);
        handleException(start);
        await initSWC("https://esm.sh/@swc/wasm-web@1.2.160/wasm_bg.wasm");
        handleException(end);
        initializedSWC = true;
      }

      const importShim = await useImportShim();

      const generate = versionCache.has(version)
        ? await loadMapCSSCore(version, importShim)
        : await (async () => {
          const msg: ProgressMessage = { type: "progress", value: "import" };
          const { start, end } = makeRoundTripMsg(msg);
          start();
          const generate = await loadMapCSSCore(version, importShim);
          end();
          return generate;
        })();
      versionCache.add(version);
      if (configCache?.ts === config) {
        const config = configCache.mod;
        const token = applyExtractor(input, config.extractor);

        const { css } = generate(
          token,
          config,
        );
        const msg: Message = { type: "content", value: { css, token } };
        handleException(() => self.postMessage(msg));
      } else {
        const { start, end } = makeRoundTripMsg({
          type: "progress",
          value: "compile",
        });
        start();
        handleException(start);
        const transpileResult = handleException(() =>
          transformSync(config, transformOption)
        ) as { code: string } | undefined;

        handleException(end);
        if (!transpileResult) return;
        const { start: startMsg, end: endMsg } = makeRoundTripMsg({
          type: "progress",
          value: "import",
        });
        handleException(startMsg);

        const uri = `data:text/javascript;base64,${btoa(transpileResult.code)}`;

        const module = await importShim(uri);
        handleException(endMsg);
        const configMod = isConfigModule(module) ? module.default : {};
        configCache = {
          ts: config,
          js: transpileResult.code,
          uri,
          mod: configMod,
        };
        const token = applyExtractor(input, configMod.extractor);
        const { css } = generate(
          token,
          configMod,
        );
        const msg: Message = { type: "content", value: { css, token } };

        handleException(() => self.postMessage(msg));
      }
    } catch (e) {
      if (e instanceof Error) {
        const msg: Message = { type: "error", value: toErrorLike(e) };

        handleException(() => self.postMessage(msg));
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

let importShimCache: ImportShim | undefined;
async function useImportShim(): Promise<(url: string) => Promise<any>> {
  return importShimCache ? importShimCache : await (async () => {
    const isSupported = await isSupportImport();
    const importShim = getImportShim(isSupported);
    importShimCache = importShim;
    return importShim;
  })();
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

async function loadMapCSSCore(
  version: string,
  importShim: ImportShim,
): Promise<typeof g> {
  const module = await importShim(
    `https://esm.sh/v73/@mapcss/core@${version}?bundle`,
  );
  return module.generate;
}
