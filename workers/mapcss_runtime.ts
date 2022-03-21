import { generate } from "@mapcss/core/generate.ts";
import type { Message } from "~/utils/message.ts";

let configCache: [string, object] | undefined;

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
      self.postMessage(msg);
    } else {
      try {
        const module = await import(uri);
        const config = module.default ?? {};
        configCache = [uri, config];
        const { css } = generate(
          code,
          config,
        );
        const msg: Message = { type: "content", value: css };
        self.postMessage(msg);
      } catch (e) {
        if (e instanceof Error) {
          const msg: Message = { type: "error", value: e };
          self.postMessage(msg);
        }
      }
    }
  },
);
