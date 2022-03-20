import { generate } from "@mapcss/core/generate.ts";

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
      self.postMessage(css);
    } else {
      const module = await import(uri);
      const config = module.default ?? {};
      configCache = [uri, config];
      const { css } = generate(
        code,
        config,
      );
      self.postMessage(css);
    }
  },
);
