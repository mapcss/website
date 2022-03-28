import { Plugin } from "aleph/types";
import { basename, join } from "https://deno.land/std@0.132.0/path/mod.ts";

export type Location = {
  from: string;
  basename?: string;
};

export default function publicPlugin(locations: Location[]): Plugin {
  return {
    name: "aleph-public",
    setup: async (aleph) => {
      await Promise.all(locations.map(async ({ from, basename: base }) => {
        const fileName = basename(base ?? from);
        return Deno.copyFile(from, join(aleph.workingDir, "public", fileName));
      }));
    },
  };
}
