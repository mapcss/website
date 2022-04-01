import { bracketExtractor, Config, simpleExtractor } from "@mapcss/core/mod.ts";
import { iconifyJSON, presetSVG } from "@mapcss/preset_svg/mod.ts";
import { presetTypography } from "@mapcss/preset_typography/mod.ts";
import { preflightCSS, presetTw } from "@mapcss/preset_tw/mod.ts";
import mdi from "https://esm.sh/@iconify-json/mdi/icons.json" assert {
  type: "json",
};
import vscodeIcons from "https://esm.sh/@iconify-json/vscode-icons/icons.json" assert {
  type: "json",
};
import autoprefixer from "https://deno.land/x/postcss_autoprefixer@0.1.1/mod.js";
// import postcss100Fix from "https://esm.sh/postcss-100vh-fix";
import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.132.0/path/mod.ts";

const logoSvg = Deno.readTextFileSync(
  join(dirname(fromFileUrl(import.meta.url)), "media", "logo.svg"),
);

const base: Config = {
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
      logo: logoSvg,
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
  extractor: [simpleExtractor, bracketExtractor],
};

const config: Config = {
  ...base,
  css: [preflightCSS],
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

export default <Config> config;
