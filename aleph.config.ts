import mapcssPlugin from "./plugins/mapcss.ts";
import googleAnalyticsPlugin from "~/plugins/google_analitics.ts";
import {
  filterDeclaration,
  generate,
  GenerateConfig,
} from "@mapcss/core/mod.ts";
import { iconifyJSON, presetSVG } from "@mapcss/preset_svg/mod.ts";
import { chain } from "@mapcss/preset_svg/deps.ts";
import { presetTypography } from "@mapcss/preset_typography/mod.ts";
import { preflightCSS, presetTw } from "@mapcss/preset_tw/mod.ts";
import { deepMerge } from "https://deno.land/std@0.130.0/collections/deep_merge.ts";

import remarkFrontmatter from "https://cdn.skypack.dev/remark-frontmatter";
import { remarkMdxFrontmatter } from "https://esm.sh/remark-mdx-frontmatter";
import rehypeSlug from "https://esm.sh/rehype-slug@5";
import rehypeHighlight from "https://esm.sh/rehype-highlight@5";
import {
  mdx,
  remarkFrontmatterProps,
  remarkTocProps,
} from "https://deno.land/x/aleph_plugin_mdx@v1.3.0-beta.1/mod.ts";
import mdi from "https://esm.sh/@iconify-json/mdi/icons.json" assert {
  type: "json",
};
import vscodeIcons from "https://esm.sh/@iconify-json/vscode-icons/icons.json" assert {
  type: "json",
};
import autoprefixer from "https://deno.land/x/postcss_autoprefixer@0.1.1/mod.js";
import { toObject } from "https://deno.land/x/postcss_js@v1.0.0-beta.4/mod.ts";
// import postcss100Fix from "https://esm.sh/postcss-100vh-fix";
import type { Config } from "aleph/types";

const base: GenerateConfig = {
  preset: [
    presetTw({
      darkMode: "class",
    }),
    presetTypography({
      css: {
        h2: {
          lineHeight: false,
        },
        pre: {
          padding: false,
        },
        "code, pre": {
          background: false,
        },
        code: {
          color: false,
        },
        ":not(pre) > code::before, :not(pre) > code::after": false,
      },
    }),
    presetSVG({
      mdi: iconifyJSON(mdi),
      vscode: {
        icons: iconifyJSON(vscodeIcons),
      },
    }, {
      declaration: {
        display: "inline-block",
        verticalAlign: "middle",
      },
    }),
  ],
  postcssPlugin: [autoprefixer()],
};

const config: GenerateConfig = {
  ...base,
  css: deepMerge(preflightCSS, {
    ".dark": {
      ...chain(generate(["bg-dark-900", "text-slate-50"], base).ast).map(
        filterDeclaration,
      ).map(
        toObject,
      ).unwrap(),
    },
    body: chain(generate("antialiased", base).ast).map(
      filterDeclaration,
    ).map(
      toObject,
    ).unwrap(),
    "button:focus": {
      ...chain(generate("outline-none", base).ast).map(
        filterDeclaration,
      ).map(
        toObject,
      ).unwrap(),
    },
  }),
  cssMap: {
    max: {
      w: {
        "8xl": {
          maxWidth: "90rem",
        },
      },
    },
  },
};

export default <Config> {
  plugins: [
    mapcssPlugin({
      ...config,
      ext: ["tsx", "mdx"],
    }),
    googleAnalyticsPlugin(Deno.env.get("MEASUREMENT_ID")),
    mdx({
      remarkPlugins: [
        remarkFrontmatter,
        remarkMdxFrontmatter as any,
        remarkFrontmatterProps,
        remarkTocProps,
      ],
      rehypePlugins: [rehypeSlug, rehypeHighlight],
      rewritePagePath: (path) => path.replaceAll("_", "-"),
    }),
  ],
};
