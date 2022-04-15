import { Plugin } from "aleph/types";
import json from "../import_map.json" assert { type: "json" };

const reactShim = json.imports["react"];
const importShim = /https:\/\/deno\.land\/x\/atomic_ui_react.*\.ts$/;
const pattern = /(import\s+\{.+\}\s+from\s+)("react")/g;

const plugin: Plugin = {
  name: "patch-remote-module-import-map",
  setup: (aleph) => {
    aleph.onLoad(importShim, async ({ specifier }) => {
      const { content } = await aleph.fetchModule(specifier);
      const raw = new TextDecoder().decode(content);

      const code = raw.replaceAll(
        pattern,
        `$1${JSON.stringify(reactShim)}`,
      );

      return {
        code,
        type: "ts",
      };
    });
  },
};

export default plugin;
