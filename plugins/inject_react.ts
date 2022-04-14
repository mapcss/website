import type { Plugin } from "aleph/types";

export default function InjectReact(): Plugin {
  return {
    name: "aleph-plugin-inject-react",
    setup: (aleph) => {
      aleph.onLoad(/\.[tj]sx$/, async (input) => {
        const { content } = await aleph.fetchModule(input.specifier);
        const code = new TextDecoder().decode(content);
        return {
          code: `import React from ${JSON.stringify("react")}\n${code}`,
          type: "tsx",
        };
      });
    },
  };
}
