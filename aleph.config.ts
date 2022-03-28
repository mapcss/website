import mapcssPlugin from "./plugins/mapcss.ts";
import googleAnalyticsPlugin from "~/plugins/google_analitics.ts";
import remarkFrontmatter from "https://cdn.skypack.dev/remark-frontmatter";
import publicCopy from "~/plugins/public.ts";
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
import type { Config } from "aleph/types";

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
    publicCopy([
      {
        from: join(dirname(fromFileUrl(import.meta.url)), "media", "logo.svg"),
        basename: "favicon.svg",
      },
    ]),
  ],
};
