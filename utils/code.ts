export const CODE =
  `<div class="h-full overflow-hidden grid place-items-center">
  <div class="p-6 relative mx-4 bg-white text-gray-700 dark:text-slate-200 dark:bg-dark-800/99 shadow-xl ring-1 ring-dark-900/6 dark:ring-white/10 sm:max-w-lg sm:mx-auto sm:rounded-lg">
    <div class="absolute inset-0 bg-gradient-to-br from-amber-500 to-teal-500 blur-md animate-pulse -z-1"></div>
    <div class="max-w-md mx-auto prose">
      <div class="divide-y divide-gray-300/50">
        <div class="py-8 text-base leading-7 space-y-6">
          <p>An online playground for MapCSS, including support for things like:</p>
          <ul class="space-y-4">
            <li class="flex items-center">
              <span class="w-6 h-6 flex-none text-teal-500 i-mdi-check-circle">✓</span>
              <p class="ml-4">Full customizable, on-demand MapCSS config with <code>TypeScript</code></p>
            </li>
            <li class="flex items-center">
              <span class="w-6 h-6 flex-none text-teal-500 i-mdi-check-circle">✓</span>
              <p class="ml-4">Preview output <code>CSS</code> and <code>Element</code></p>
            </li>
            <li class="flex items-center">
              <span class="w-6 h-6 flex-none text-teal-500 i-mdi-check-circle">✓</span>
              <p class="ml-4">Sharing, reporting issue is easy</p>
            </li>
          </ul>
          <p>Perfect for learning how the framework works, prototyping a new idea, or creating a demo to share online.</p>
        </div>
      <div class="pt-8 text-base leading-7 font-semibold">
        <p class="text-gray-900 dark:text-white">Want to dig deeper into MapCSS?</p>
        <p>
          <a href="/docs/installation" target="_blank" class="text-amber-500 hover:text-amber-600 transition-colors duration-200">Read the docs<span class="i-mdi-arrow-right-thick">&rarr;</span></a>
        </p>
      </div>
    </div>
  </div>
</div>
`;

export const RAW_CONFIG =
  `import { preflightCSS, presetTw } from "https://esm.sh/@mapcss/preset-tw@beta";
import { presetTypography } from "https://esm.sh/@mapcss/preset-typography@beta";
import { simpleExtractor, bracketExtractor } from "https://esm.sh/@mapcss/config@beta";
import type { Config } from "config";

/** You can try the following features:
 * - Chrome 80+
 * - iOS Safari 15+
 */
// import { presetSVG, iconifyJSON } from "https://esm.sh/@mapcss/preset-svg@beta"
// import mdi from "https://esm.sh/@iconify-json/mdi/icons.json" assert {
// type: "json",
// };
// import autoprefixer from "https://esm.sh/autoprefixer"

export default <Config> {
  separator: "-",
  variablePrefix: "map-",
  extractor: [simpleExtractor, bracketExtractor],
  preset: [
    presetTw({
      darkMode: "class",
    }),
    presetTypography({
      css: {
        p: false,
        a: {
          textDecoration: false,
          color: false,
        },
      },
    }),
    // presetSVG({
    //   mdi: iconifyJSON(mdi)
    // })
  ],
  minify: false,
  css: preflightCSS,
  // postcssPlugin: [autoprefixer]
};
`;

export const TYPES = `
export type AcceptedPlugin =
  | Plugin
  | PluginCreator<any>
  | OldPlugin<any>
  | TransformCallback
  | {
    postcss: TransformCallback | Processor;
  }
  | Processor;

export type BinaryTree<Leaf, P extends PropertyKey = string | number> = {
  [k in P]: Leaf | BinaryTree<Leaf>;
};

export type CSSDefinition = {
  type: "css";
  value: BinaryTree<string | number>;
};

export type CSSObject =
  | CSSDefinition
  | Root
  | BlockDefinition;

export type Preset = Labeled & {
  fn: (
    context: Readonly<Omit<StaticContext, "theme">>,
  ) => Partial<Omit<StaticConfig, "preset">>;
};

export type Theme = BinaryTree<string>;

export type StaticConfig = {
  /** Hierarchy of CSS-in-JS  */
  cssMap: CSSMap;

  /** Hierarchy of modifier */
  modifierMap: ModifierMap;

  theme: Theme;

  preset: Preset[];

  syntax: Syntax[];

  preProcess: PreProcessor[];

  /** PostCSS plugins  */
  postcssPlugin: AcceptedPlugin[];

  /** Inject raw CSS Statement with CSS-in-JS style */
  css: BinaryTree<string | number>;
};

export type GenerateConfig = Partial<StaticConfig & StaticContext>;

export type StaticContext = {
  theme: Readonly<Theme>;

  /** The token separator
   * @default \`-\`
   */
  separator: string;

  /** Prefix for CSS custom property (variable)
   * @default 'map-'
   */
  variablePrefix: string;

  /** Specifies a map of strings.
   * It is mainly used to reassign special characters.
   * @default charMap: { "_": " " }
   */
  charMap: Readonly<Record<string, string>>;

  /** Whether or not to minify the Node
   * This will compress AST and outputted Style Sheets, but will reduce performance.
   * It is recommended to use it in production.
   * @default false
   */
  minify: boolean;
};

export type RuntimeContext = {
  /** The token as it
   *
   * example: \`sm:text-red-500\` -> \`sm:text-red-500\`
   */
  token: string;

  /** The token after conversion with char map
   *
   * example:
   *
   * token: \`content-['hello_world']\`
   *
   * charMap: \`{ "_": " " }\`
   *
   * mappedToken: \`content-['hello world']\`
   */
  mappedToken: string;

  /** The token with \`.\` and escaped for selector.
   *
   * example: \`text-red-500/[10]\` -> \`.text-red-500\\[10\\]\`
   */
  className: string;
};

export type SyntaxContext = StaticContext & {
  modifierRoots: string[];
  identifierRoots: string[];
};
export type ParseResult = {
  identifier: string;
  modifiers?: string[];
};

export type Syntax = Labeled & {
  fn: (
    token: RuntimeContext["token"],
    context: Readonly<SyntaxContext>,
  ) => ParseResult | undefined;
};

export type Labeled = {
  /** The name will probably be used to remove duplicates. */
  name: string;
};

export type PreProcessor = Labeled & {
  fn: (root: Readonly<Root>, context: Readonly<StaticContext>) => Root;
};

/** User definition of CSS Block Declaration */
export type BlockDefinition = Record<string, string | number>;

export type DynamicCSS = (
  /** Match info */
  matchInfo: MatchInfo,
  context: Readonly<
    & StaticContext
    & RuntimeContext
  >,
) => CSSMap | CSSObject | undefined;

export type IdentifierDefinition =
  | CSSObject
  | DynamicCSS
  | CSSMap;

export type CSSMap =
  | {
    [k in string | number]: IdentifierDefinition;
  }
  | {
    /** Default accessor */
    "": IdentifierDefinition;

    /** Catch all property accessor */
    "*": IdentifierDefinition;
  };

export type ModifierMap =
  | {
    [k in string | number]: ModifierDefinition;
  }
  | {
    /** Default accessor */
    "": IdentifierDefinition;

    /** Catch all property accessor */
    "*": ModifierDefinition;
  };

export type Modifier = (
  parentNode: Readonly<Root>,
  matchInfo: MatchInfo,
  context: Readonly<StaticContext & RuntimeContext>,
) => Root | undefined;

export type ModifierDefinition = Modifier | ModifierMap;

export type MatchInfo = {
  /** Matched property key
   *
   * example: text-\`red\`-500 -> \`red\`
   */
  id: string;

  /** The matched parent property key
   *
   * example: text-\`red\`-500 -> \`text\`
   */
  parentId?: string;

  /** Full path */
  fullPath: string;

  /** Current search path
   *
   * example: \`text-red-500\`
   *
   * 1st: \`["text-red-500"]\`
   *
   * 2nd: \`["text-red", "500"]\`
   *
   * 3rd: \`["text", "red", "500"]\`
   */
  path: string[];
};

export type Extractor = Labeled & {
  fn: (code: string) => Set<string>;
};
export type Arrayable<T> = T | T[];
export type Config = {
  /** Token extractor
   * @default {@link SimpleExtractor}
   */
  extractor?: Arrayable<Extractor>;
} & GenerateConfig`;
