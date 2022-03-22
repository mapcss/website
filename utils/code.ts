export const CODE =
  `<div class="h-full overflow-hidden grid place-items-center">
  <div class="p-6 bg-white text-gray-600 dark:text-slate-200 dark:bg-dark-800 shadow-xl ring-1 ring-dark-900/6 dark:ring-white/10 sm:max-w-lg sm:mx-auto sm:rounded-lg sm:px-10">
    <div class="max-w-md mx-auto">
      <div class="divide-y divide-gray-300/50">
        <div class="py-4 sm:py-8 text-base leading-7 space-y-6">
          <p>An advanced online playground for MapCSS, including support for things like:</p>
          <ul class="space-y-4">
            <li class="flex items-center">
            <span class="w-6 h-6 flex-none text-teal-500 i-mdi-check-circle">✓</span></span>
          <p class="ml-4">
            Full customizable, on-demand
            <code class="text-sm font-bold text-gray-900 dark:text-white">mapcss.config.ts</code>
          </p>
        </li>
        <li class="flex items-center">
          <span class="w-6 h-6 flex-none text-teal-500 i-mdi-check-circle">✓</span>
          <p class="ml-4">
            Preview output <code class="text-sm font-bold text-gray-900 dark:text-white">CSS</code> and <code class="text-sm font-bold text-gray-900 dark:text-white">Element</code>
          </p>
        </li>
      </ul>
      <p>Perfect for learning how the framework works, prototyping a new idea, or creating a demo to share online.</p>
    </div>
    <div class="pt-8 text-base leading-7 font-semibold">
      <p class="text-gray-900 dark:text-white">Want to dig deeper into MapCSS?</p>
      <p>
        <a href="/docs/installation" class="text-amber-500 hover:text-amber-600">Read the docs &rarr;</a>
      </p>
    </div>
  </div>
</div>
`;

export const RAW_CONFIG = `/**
 * @remarks
 * MapCSS is published to deno.land/x x.nest.land, npm registry.
 * To deno.land/x, x.nest.land is published in TypeScript, so we use JavaScript module in Browser.
 *
 * @example
 * Deno env
 *
 * \`\`\`ts
 * import { generate } from "https://deno.land/x/mapcss/core/mod.ts"
 * import { presetSVG } from "https://x.nest.land/mapcss/preset_svg/mod.ts"
 * \`\`\`
 *
 * Browser
 * \`\`\`js
 * import { presetTw } from "https://esm.sh/@mapcss/preset-tw"
 * import { presetTypography } from "https://esm.sh/@mapcss/preset-typography"
 * import { presetSVG } from "https://esm.sh/@mapcss/preset-svg"
 * \`\`\`
 */
import { presetTw, preflightCSS } from "https://esm.sh/@mapcss/preset-tw@beta"

/** Depending on the Browser, you can try the following features:
 * - Chrome 80+
 * - iOS Safari 15+
 * - Other browsers that support module workers
 */
// import { presetSVG, iconifyJSON } from "https://esm.sh/@mapcss/preset-svg@beta"
// import mdi from "https://esm.sh/@iconify-json/mdi/icons.json" assert {
// type: "json",
// };
// import autoprefixer from "https://esm.sh/autoprefixer"

export default {
  separator: "-",
  variablePrefix: "map-",
  preset: [
    presetTw({
      darkMode: "class",
    }),
    // presetSVG({
    //   mdi: iconifyJSON(mdi)
    // })
  ],
  minify: false,
  css: preflightCSS,
  // postcssPlugin: [autoprefixer]
}
`;
