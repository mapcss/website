import {
  applyExtractor,
  Config as GenerateConfig,
  generate,
} from "@mapcss/core/mod.ts";
import {
  resolveConfigFile,
  resolveConfigFilePath,
} from "@mapcss/config/mod.ts";
import { fromFileSystem } from "@mapcss/config/util.ts";
import { expandGlob, WalkEntry } from "https://deno.land/std@0.125.0/fs/mod.ts";
import { ensureFileSync } from "https://deno.land/std@0.132.0/fs/ensure_file.ts";
import type { Plugin } from "aleph/types";

export type Config = GenerateConfig & {
  /** watch file type
   * @default ['tsx', 'jsx']
   */
  ext?: string[];
};

export default function mapcssPlugin(
  { ext = ["tsx", "jsx"], ...rest }: Config,
): Plugin {
  return {
    name: "mapcss/loader",
    setup: async (aleph) => {
      const configPath = await resolveConfigFilePath(fromFileSystem());
      const config = configPath
        ? await resolveConfigFile(configPath)
        : undefined;
      const filePath = "./style/map.css";
      ensureFileSync(filePath);

      const tokens = new Set<string>();
      const extractToken = (code: string) => {
        const _tokens = applyExtractor(
          code,
          config?.extractor,
        );
        _tokens.forEach((token) => {
          tokens.add(token);
        });
        return tokens;
      };

      aleph.onTransform("hmr", async ({ code, module }) => {
        if (/\.tsx|\.mdx$/.test(module.specifier)) {
          const tokens = extractToken(code);
          const { css } = await generate(tokens, config ?? rest);
          Deno.writeTextFileSync(filePath, css);
        }
      });

      if (aleph.mode === "production") {
        const walkEntry = expandGlob("**/*.{tsx,mdx}");
        const paths = new Set<WalkEntry>();
        for await (const entry of walkEntry) {
          if (entry.isFile) {
            paths.add(entry);
          }
        }
        const texts = Array.from(paths).map(({ path }) =>
          Deno.readTextFileSync(path)
        );
        const allCode = texts.reduce((acc, cur) => `${acc}\n${cur}`, "");
        const id = `data-module-id="/style/map.css"`;
        const tokens = extractToken(allCode);

        const { css } = await generate(tokens, {
          minify: true,
          ...config,
        });
        aleph.onRender((i) => {
          const head = i.html.head.filter((headTag) => !headTag.includes(id));

          i.html.head = [
            `<style type="text/css" ${id} ssr>${css}</style>`,
            ...head,
          ];
        });
      }
    },
  };
}
