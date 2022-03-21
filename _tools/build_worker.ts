import { denoPlugin } from "https://deno.land/x/esbuild_deno_loader@0.4.1/mod.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.14.25/mod.js";

await esbuild.build({
  plugins: [denoPlugin({
    importMapFile: "./import_map.json",
  })],
  entryPoints: ["./workers/mapcss_runtime.ts"],
  outfile: "public/worker.js",
  bundle: true,
  define: {
    "Deno.build": `{ "os": "linux" }`,
    "import.meta.url": `{}`,
  },
  format: "esm",
  treeShaking: true,
  target: "es2018",
  minify: true,
  watch: true,
});

// esbuild.stop();
