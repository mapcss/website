import mapcssPlugin from "./plugins/mapcss.ts";
import googleAnalyticsPlugin from "~/plugins/google_analitics.ts";
import injectReactPlugin from "~/plugins/inject_react.ts";
import patchRemoteImportMap from "~/plugins/patch_remote_import_map.ts";
import remarkFrontmatter from "https://cdn.skypack.dev/remark-frontmatter";
import copy2Public from "~/plugins/public.ts";
import { remarkMdxFrontmatter } from "https://esm.sh/remark-mdx-frontmatter";
import rehypeSlug from "https://esm.sh/rehype-slug@5";
import rehypeHighlight from "https://esm.sh/rehype-highlight@5";
import {
  mdx,
  remarkFrontmatterProps,
  remarkTocProps,
} from "https://deno.land/x/aleph_plugin_mdx@v1.3.0-beta.1/mod.ts";
import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.132.0/path/mod.ts";
import postcssMapcss from "https://deno.land/x/postcss_mapcss@1.0.0-beta.2/mod.ts";
import postcssNesting from "https://cdn.jsdelivr.net/npm/postcss-nesting@10/mod.js";
import type { Config } from "aleph/types";

const mediaDirPath = join(dirname(fromFileUrl(import.meta.url)), "media");

export default <Config> {
  plugins: [
    mapcssPlugin({
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
    copy2Public([
      {
        from: join(mediaDirPath, "logo.svg"),
        basename: "favicon.svg",
      },
      {
        from: join(mediaDirPath, "hero-playground.png"),
      },
    ]),
    injectReactPlugin(),
    patchRemoteImportMap,
  ],
  css: {
    postcss: {
      plugins: [
        postcssNesting,
        postcssMapcss({
          injectCSS: false,
        }),
      ],
    },
  },
};
