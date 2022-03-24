import React, { useEffect, useMemo, useState } from "react";
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
import ShadowRoot from "~/components/shadow_root.tsx";
import useUpdateEffect from "~/hooks/use_update_effect.ts";
import type { ErrorLike, Message } from "~/utils/message.ts";

import "https://unpkg.com/construct-style-sheets-polyfill";

const Err = dynamic(() => import("~/components/err.tsx"));

export const editorOptions: EditorProps["options"] = {
  fontFamily: `Menlo, Monaco, 'Courier New', monospace`,
  fontSize: 13,
  minimap: { enabled: false },
  tabSize: 2,
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
  const [input, setInput] = useState<string | undefined>(CODE);
  const [cssSheet, setCSSSheet] = useState("");
  const [rawConfig, setRawConfig] = useState<string>(
    RAW_CONFIG,
  );
  const [rawConfigDiff, setRawConfigDiff] = useState<string>(RAW_CONFIG);

  const [monacoSet, setMonacoSet] = useState<Parameters<OnMount>>();
  const [error, setError] = useState<ErrorLike>();

  const save = () => setRawConfigDiff(rawConfig);

  const theme = useColorModeValue("light", "vs-dark");
  const darkClass = useColorModeValue("", "dark");
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
    worker.postMessage({ code: input, rawConfig });
  }, [worker, input, rawConfigDiff]);

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
    <div className="h-screen flex flex-col">
      <Header className="flex-none" />
      <main className="lg:grid flex-1 grid-cols-2">
        <div className="h-full flex flex-col lg:border-r border-slate-900/10">
          <div
            role="toolbar"
            className="pr-2 justify-between inline-flex whitespace-pre"
          >
            <div
              role="tablist"
              className="flex-shrink-0 overflow-x-scroll"
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
                    {
                      "border-amber-500 italic border-b-1": select === i,
                    },
                    className,
                    "pl-3 py-0.5",
                  )}
                >
                  <span className={clsx(icon)} />
                  <span className="align-middle mx-1">
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

            <section>
              <button
                disabled={!enabledSave}
                onClick={save}
                className={clsx(
                  "disabled:text-gray-400 i-mdi-content-save text-teal-500",
                  {
                    "hidden": select !== 1,
                  },
                )}
                title="save"
              />
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
                    onChange={setInput}
                    defaultValue={CODE}
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
  );
}
