import type { Plugin } from "aleph/types";

export function preserveReact(): Plugin {
  return {
    name: "preserve-react",
    setup(aleph) {
      const importDecl = `import React from "https://esm.sh/react@17.0.2"`;
      aleph.onLoad(/\.tsx$/, async ({ identifier }) => {
        const module = await aleph.fetchModule(identifier);
        const code = new TextDecoder().decode(module.content);

        const includesReact = /import\s+React.*from\s+["'].+["']/.test(code);

        if (includesReact) {
          return {
            code,
            type: "tsx",
          };
        } else {
          return {
            code: `${importDecl}\n${code}`,
            type: "tsx",
          };
        }
      });
    },
  };
}
