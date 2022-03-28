import React, { useContext, useEffect, useMemo, useState } from "react";
import Editor, {
  EditorProps,
  OnMount,
} from "https://esm.sh/@monaco-editor/react@4.3.1?deps=monaco-editor@0.33.0,react@17.0.2&pin=v69";
import useColorModeValue from "~/hooks/use_color_mode_value.ts";
import useResize from "~/hooks/use_resize.ts";
import { Header } from "~/components/header.tsx";
import { clsx } from "~/deps.ts";
import { CODE, RAW_CONFIG, TYPES } from "~/utils/code.ts";
import { dynamic } from "aleph/react";
import useUpdateEffect from "~/hooks/use_update_effect.ts";
import { encode } from "https://deno.land/std@0.131.0/encoding/base64url.ts";
import { autoCloseTag } from "~/utils/monaco.ts";
import { BASE_ISSUE_URL } from "~/utils/constant.ts";
import { ToastContext } from "~/contexts/mod.ts";
import useToast from "~/hooks/use_toast.ts";
import { getParam, useVersion } from "~/hooks/use_mapcss.ts";
import useRender, { Renderer } from "~/hooks/use_render.ts";
import parser from "https://deno.land/x/ua_parser_js@1.0.2/src/ua-parser.js";

import type { Data, ErrorLike, Message } from "~/utils/message.ts";

import "https://unpkg.com/construct-style-sheets-polyfill";

const DESCRIPTION =
  `An online playground for MapCSS lets you use all of MapCSS's features directly in the browser.`;
const TITLE = `MapCSS Playground`;
const BASE_URL = `https://mapcss.miyauchi.dev`;
const OG_IMAGE = `${BASE_URL}/hero-playground.png`;
const Err = dynamic(() => import("~/components/err.tsx"));
const ShadowRoot = dynamic(() => import("~/components/shadow_root.tsx"));
const Alert = dynamic(() => import("~/components/alert.tsx"));
const IssueForm = dynamic(() => import("~/components/issue_form.tsx"));

async function getIssueReportUrl({
  input,
  config,
  version,
  runtime,
}: Data & { runtime: string }): Promise<string> {
  const reportUrl = new URL(BASE_ISSUE_URL);
  const playgroundLink = await makeShareURL({ input, config, version });
  const table: [string, string][] = [
    ["input", input],
    ["config", config],
    ["version", version],
    ["playground-link", playgroundLink.toString()],
    ["runtime", runtime],
  ];
  table.filter(([key, value]) => !!key && !!value).forEach(([key, value]) => {
    reportUrl.searchParams.set(key, value);
  });
  return reportUrl.toString();
}

function getBrowserVersion(): string {
  try {
    const { browser } = parser();
    if (browser.name && browser.version) {
      return `${browser.name} ${browser.version}`;
    }
  } catch {}
  return "";
}
export const editorOptions: EditorProps["options"] = {
  fontFamily: `Menlo, Monaco, 'Courier New', monospace`,
  fontSize: 13,
  minimap: { enabled: false },
  tabSize: 2,
};

const makeShareURL = async (
  { input, config, version }: Data,
): Promise<URL> => {
  const url = new URL(window.location.href);

  url.searchParams.set("input", encode(input));
  url.searchParams.set("config", encode(config));
  url.searchParams.set("version", encode(version));
  return url;
};

const tabs:
  ({ name: string; icon: string } & JSX.IntrinsicElements["button"])[] = [
    { name: "html", icon: "i-vscode-icons-file-type-html w-4 h-4" },
    {
      name: "config",
      icon: "i-vscode-icons-file-type-typescript-official w-4 h-4",
    },
    {
      name: "css",
      icon: "i-vscode-icons-file-type-css w-4 h-4",
    },
    {
      name: "preview",
      className: "lg:hidden",
      icon: "i-mdi-tablet-dashboard w-4 h-4",
    },
  ];

export default function Playground() {
  const { version, setVersion, latestVersions } = useVersion();
  const state = useContext(ToastContext);
  const toast = useToast(state);
  const [input, setInput] = useState<string>(() =>
    getParam({ param: "input", defaultAs: CODE })
  );

  const configSetter = () =>
    getParam({ param: "config", defaultAs: RAW_CONFIG });

  const [cssSheet, setCSSSheet] = useState("");
  const [rawConfig, setRawConfig] = useState<string>(
    configSetter,
  );
  const [rawConfigDiff, setRawConfigDiff] = useState<string>(configSetter);

  const [monacoSet, setMonacoSet] = useState<Parameters<OnMount>>();
  const [error, setError] = useState<ErrorLike>();

  const save = () => setRawConfigDiff(rawConfig);

  const theme = useColorModeValue("light", "vs-dark");
  const darkClass = useColorModeValue("", "dark");
  const [nodes, render] = useRender();
  const cssStyle = useMemo(() => {
    if (!window || !cssSheet) return;
    const style = new CSSStyleSheet();
    (style as any).replaceSync(cssSheet);

    return style;
  }, [cssSheet]);

  const handleMount: OnMount = (editor, monaco) => {
    monaco.languages.typescript.typescriptDefaults
      .setDiagnosticsOptions({
        diagnosticCodesToIgnore: [2792, 2821],
      });

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      ...monaco.languages.typescript.typescriptDefaults
        .getCompilerOptions(),
      strict: true,
      noImplicitAny: true,
    });
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      TYPES,
      "inmemory://model/config.ts",
    );
    setMonacoSet([editor, monaco]);
  };

  useEffect(() => {
    if (!monacoSet) return;
    const [editor, monaco] = monacoSet;
    const fn = editor.addAction({
      label: "save",
      id: "save",
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      ],
      run: save,
    });

    return () => fn.dispose();
  }, [monacoSet, rawConfig]);

  const [worker, setWorker] = useState<Worker>();

  useEffect(() => {
    setWorker(new Worker("/worker.js"));
  }, []);
  useEffect(() => {
    if (!worker) return;
    return () => worker.terminate();
  }, [worker]);

  useEffect(() => {
    if (!worker) return;
    worker.onmessage = ({ data }: MessageEvent<Message>) => {
      if (data.type === "error") {
        setResult({ status: "error" });
        setError(data.value);
      } else if (data.type === "content") {
        setResult({ status: "success" });
        setCSSSheet(data.value);
      } else {
        setResult({ status: "wait", type: data.value });
      }
    };
    const data: Data = { input, config: rawConfigDiff, version };
    worker.postMessage(data);
  }, [worker, input, rawConfigDiff, version]);

  type Result =
    | {
      status: "success";
    }
    | { status: "error" }
    | { status: "wait"; type?: "init" | "import" | "compile" };

  const [result, setResult] = useState<Result>({ status: "wait" });
  const waitingMsg = useMemo(() => {
    if (result.status !== "wait") return;
    switch (result.type) {
      case "init": {
        return "Initializing TypeScript Compiler...";
      }
      case "compile": {
        return "Compiling Config...";
      }
      case "import": {
        return "Fetching Modules...";
      }
      default: {
        return "Processing...";
      }
    }
  }, [result]);

  const classNameMsg = useMemo(() => {
    if (result.status !== "wait") return;
    switch (result.type) {
      case "init":
      case "compile": {
        return "text-blue-500";
      }
      case "import": {
        return "text-amber-500";
      }
      default: {
        return "text-teal-500";
      }
    }
  }, [result]);

  const enabledSave = useMemo<boolean>(() => rawConfigDiff !== rawConfig, [
    rawConfigDiff,
    rawConfig,
  ]);

  const [select, setSelect] = useState(0);
  const [reflect, setReflect] = useState(0);

  useUpdateEffect(() => {
    // work around for remove monaco editor from DOM
    const select = reflect;
    setSelect(NaN);
    const id = requestAnimationFrame(() => setSelect(select));
    return () => cancelAnimationFrame(id);
  }, [reflect]);

  useResize((ev) => {
    if ((ev.currentTarget as Window).innerWidth > 1024) {
      setReflect(0);
    }
  }, { deps: [], enabled: select === 3 });

  return (
    <>
      <head>
        <title>{TITLE}</title>
        <meta
          content={DESCRIPTION}
          name="description"
        />
        <meta property="og:title" content={TITLE} />
        <meta
          property="og:description"
          content={DESCRIPTION}
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={TITLE} />
        <meta property="og:url" content={BASE_URL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta
          name="twitter:card"
          content="summary_large_image"
        />
        <meta
          name="twitter:image"
          content={OG_IMAGE}
        />
        <meta name="apple-mobile-web-app-title" content={TITLE} />
        <meta name="application-name" content={TITLE} />
      </head>
      <div className="h-screen overflow-hidden flex flex-col">
        <Header className="flex-none" />
        <main className="lg:grid flex-1 grid-cols-2">
          <div className="h-full flex flex-col lg:border-r border-slate-900/10">
            <div role="toolbar" className="justify-between flex">
              <div
                role="tablist"
                className="overflow-x-scroll flex-1 flex"
                aria-orientation="horizontal"
              >
                {tabs.map(({ name, className, icon, ...rest }, i) => (
                  <button
                    role="tab"
                    type="button"
                    aria-selected={select === i}
                    onClick={() => setReflect(i)}
                    key={name}
                    {...rest}
                    className={clsx(
                      select === i
                        ? "border-amber-500 italic"
                        : "border-transparent",
                      className,
                      "pl-3 inline-flex items-center border-b-1",
                    )}
                  >
                    <span className={clsx(icon)} />
                    <span className="mx-1">
                      {name}
                    </span>
                    <span
                      className={clsx(
                        "i-mdi-circle w-2 h-2 text-teal-500",
                        name === "config" && enabledSave
                          ? "visible"
                          : "invisible",
                        {
                          "invisible": name !== "config",
                        },
                      )}
                    />
                  </button>
                ))}
              </div>

              <section className="flex-none px-1 py-0.5 flex text-sm items-center space-x-1 whitespace-pre">
                <select
                  value={version}
                  onChange={(v) => setVersion(v.currentTarget.value)}
                  className="focus:outline-none px-1 fixed z-1 bottom-4 right-4 sm:static rounded-md border-1 border-slate-900/10 dark:border-slate-300/10 h-[26px] cursor-pointer backdrop-blur hover:bg-gray-100 dark:hover:bg-dark-300 transition duration-200 focus:ring-1 ring-amber-500"
                >
                  {latestVersions.map((version) => (
                    <option key={version}>{version}</option>
                  ))}
                </select>
                <button
                  disabled={!enabledSave}
                  onClick={save}
                  className={clsx(
                    "group relative space-x-2 rounded-md p-1 border-1 border-slate-900/10 dark:border-slate-300/10 focus:ring-1 ring-amber-500 transition duration-200 hover:bg-gray-100 dark:hover:bg-dark-300 disabled:text-gray-400",
                    select === 1 ? "inline-flex" : "hidden",
                  )}
                >
                  <span
                    className={clsx(
                      { "text-teal-500 ": enabledSave },
                      "i-mdi-content-save w-4 h-4",
                    )}
                  />
                  <span className="text-sm hidden lg:group-hover:block absolute mt-9 -translate-x-1/2 -translate-y-1/2 bg-white shadow dark:bg-dark-900 border border-gray-200 dark:border-dark-100 rounded-md px-1 z-1">
                    Save
                  </span>
                </button>
                <button
                  onClick={async () => {
                    const runtime = getBrowserVersion();
                    const url = await getIssueReportUrl({
                      input,
                      config: rawConfigDiff,
                      version,
                      runtime,
                    });
                    const playgroundLink = await makeShareURL({
                      input,
                      config: rawConfigDiff,
                      version,
                    });

                    // GitHub max data size
                    if (url.length > 8190) {
                      render({
                        fn: ({ unmount }) => (
                          <div
                            role="dialog"
                            className="inset-0 fixed backdrop-blur z-2 grid place-items-center"
                          >
                            <div className="bg-white overflow-scroll h-full sm:h-140 w-full sm:w-120 border-gray-200 shadow dark:bg-dark-800 border dark:border-dark-200 rounded-md">
                              <header className="px-4 py-2">
                                <button onClick={unmount}>
                                  <span className="i-mdi-close h-6 w-6" />
                                </button>
                              </header>
                              <section className="px-4 pb-4">
                                <div className="text-center mb-4 sm:mb-8">
                                  <span className="i-mdi-bug w-20 h-26 sm:w-24 sm:h-24" />
                                  <span className="i-mdi-arrow-right-bold w-12 h-12 sm:w-16 sm:h-16" />
                                  <span className="i-mdi-github w-20 h-20 sm:w-24 sm:h-24" />
                                </div>
                                <p className="sm:text-center">
                                  The data to be sent to GitHub was too large.
                                </p>
                                <p className="sm:text-center">
                                  Please open{" "}
                                  <a
                                    className="text-amber-500 font-bold"
                                    href={BASE_ISSUE_URL}
                                    target="_blank"
                                  >
                                    issue
                                  </a>{" "}
                                  and try Copy & Paste.
                                </p>
                                <hr className="my-3 border-gray-100 border-dark-300" />
                                <IssueForm
                                  {...{
                                    input,
                                    config: rawConfigDiff,
                                    version,
                                    playgroundLink: playgroundLink.toString(),
                                    runtime,
                                  }}
                                />
                              </section>
                            </div>
                          </div>
                        ),
                      });
                    } else {
                      window.open(url, "_blank")?.focus();
                    }
                  }}
                  className="group relative space-x-2 rounded-md inline-flex p-1 border-1 border-slate-900/10 dark:border-slate-300/10 hover:bg-gray-100 dark:hover:bg-dark-300 focus:ring-1 ring-amber-500 transition duration-200"
                >
                  <span className="i-mdi-bug w-4 h-4" />
                  <span className="text-sm hidden lg:group-hover:block absolute mt-9 -translate-x-1/2 -translate-y-1/2 bg-white shadow dark:bg-dark-900 border border-gray-200 dark:border-dark-100 rounded-md px-1 z-1">
                    Report issue
                  </span>
                </button>
                <button
                  onClick={async () => {
                    const url = await makeShareURL({
                      input,
                      config: rawConfigDiff,
                      version,
                    });
                    window.navigator.clipboard.writeText(
                      url.href,
                    );
                    toast({
                      render: ({ enqueued, dispose }) => (
                        <Alert
                          className={enqueued ? "opacity-100" : "opacity-0"}
                          icon={<span className="i-mdi-check-circle w-6 h-6" />}
                          close={
                            <button className="inline-flex" onClick={dispose}>
                              <span className="i-mdi-close w-6 h-6" />
                            </button>
                          }
                        >
                          URL is copied to clipboard.
                        </Alert>
                      ),
                    });
                  }}
                  className="group relative space-x-2 rounded-md inline-flex p-1 border-1 border-slate-900/10 dark:border-slate-300/10 hover:bg-gray-100 dark:hover:bg-dark-300 focus:ring-1 ring-amber-500 transition duration-200"
                >
                  <span className="i-mdi-share-variant w-4 h-4" />
                  <span className="text-sm hidden lg:group-hover:block absolute mt-9 -translate-x-1/2 -translate-y-1/2 bg-white shadow dark:bg-dark-900 border border-gray-200 dark:border-dark-100 rounded-md px-1 z-1">
                    Share URL
                  </span>
                </button>
              </section>
            </div>

            <div className="flex-1" role="tabpanel">
              {select === 0
                ? (() => {
                  return (
                    <Editor
                      options={{
                        ...editorOptions,
                      }}
                      loading={<></>}
                      defaultLanguage="html"
                      onChange={(v) => setInput(v ?? "")}
                      defaultValue={CODE}
                      onMount={(editor) => autoCloseTag(editor)}
                      value={input}
                      theme={theme}
                    />
                  );
                })()
                : select === 1
                ? (
                  <Editor
                    options={editorOptions}
                    loading={<></>}
                    defaultLanguage="typescript"
                    onChange={(value) => setRawConfig(value ?? "")}
                    value={rawConfig}
                    theme={theme}
                    onMount={handleMount}
                  />
                )
                : select === 2
                ? (
                  <Editor
                    options={{
                      ...editorOptions,
                      readOnly: true,
                    }}
                    loading={<></>}
                    defaultLanguage="css"
                    value={cssSheet}
                    theme={theme}
                  />
                )
                : select === 3
                ? result.status === "wait"
                  ? (
                    <div className="h-full grid place-items-center">
                      <div className="flex flex-col items-center space-y-2 text-amber-500">
                        <span className="i-mdi-loading animate-spin w-12 h-12" />
                        <span className="text-xl">Fetching modules...</span>
                      </div>
                    </div>
                  )
                  : result.status === "success"
                  ? cssStyle && input && (
                    <ShadowRoot
                      mode="closed"
                      className="h-full"
                      onRender={(root) => {
                        if (cssStyle) {
                          (root as any).adoptedStyleSheets = [cssStyle];
                        }
                      }}
                    >
                      <div
                        className={clsx("h-full", darkClass)}
                        dangerouslySetInnerHTML={{ __html: input }}
                      />
                    </ShadowRoot>
                  )
                  : result.status === "error"
                  ? error && <Err file="config" className="h-full" e={error} />
                  : <></>
                : <></>}
            </div>
          </div>

          <div className="h-full hidden lg:block">
            {result.status === "wait"
              ? (
                <div className="h-full grid place-items-center">
                  <div
                    className={clsx(
                      "flex flex-col items-center space-y-2",
                      classNameMsg,
                    )}
                  >
                    <span className="i-mdi-loading animate-spin w-12 h-12" />
                    <span className="text-xl">{waitingMsg}</span>
                  </div>
                </div>
              )
              : result.status === "success"
              ? cssStyle && input && (
                <ShadowRoot
                  mode="closed"
                  className="h-full"
                  onRender={(root) => {
                    if (cssStyle) {
                      (root as any).adoptedStyleSheets = [cssStyle];
                    }
                  }}
                >
                  <div
                    className={clsx("h-full", darkClass)}
                    dangerouslySetInnerHTML={{ __html: input }}
                  />
                </ShadowRoot>
              )
              : result.status === "error"
              ? error && <Err file="config" className="h-full" e={error} />
              : <></>}
          </div>
        </main>
      </div>

      <Renderer>{nodes}</Renderer>
    </>
  );
}
