import React, { useEffect, useMemo, useState } from "react";
import Editor, {
  EditorProps,
  OnMount,
} from "https://esm.sh/@monaco-editor/react?pin=v69";
import root from "https://esm.sh/react-shadow";
import useColorModeValue from "~/hooks/use_color_mode_value.ts";
import useResize from "~/hooks/use_resize.ts";
import { Header } from "~/components/header.tsx";
import { clsx } from "~/deps.ts";
import { Tab } from "https://esm.sh/@headlessui/react@1.5.0?pin=v69";
import { CODE, RAW_CONFIG } from "~/utils/code.ts";
import type { ErrorLike, Message } from "~/utils/message.ts";
import { dynamic } from "aleph/react";

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
  const [selectedIndex, setSelectedIndex] = useState<number>();

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

  const handleMound: OnMount = (editor, monaco) => {
    monaco.languages.typescript.typescriptDefaults
      .setDiagnosticsOptions({
        noSemanticValidation: true,
      });

    setMonacoSet([editor, monaco]);
  };

  useEffect(() => {
    if (!monacoSet) return;
    const [editor, monaco] = monacoSet;

    const fn = editor.addAction({
      label: "save",
      id: "save",
      keybindings: [
        monaco.KeyMod.CtrlCmd | (monaco.KeyCode as any).KEY_S,
      ],
      run: save,
    });

    return () => fn.dispose();
  }, [monacoSet, rawConfig]);

  const [sw, setSw] = useState<Worker>();

  useEffect(() => {
    setSw(new Worker("./worker.js"));
  }, []);
  useEffect(() => {
    if (!sw) return;
    return () => sw.terminate();
  }, [sw]);

  useEffect(() => {
    if (!sw) return;
    sw.onmessage = ({ data }: MessageEvent<Message>) => {
      if (data.type === "error") {
        setError(data.value);
      } else {
        if (error) {
          setError(undefined);
        }
        setCSSSheet(data.value);
      }
    };
    sw.postMessage({ code: input, rawConfig: rawConfigDiff });
  }, [sw, input, rawConfigDiff]);

  const enabledSave = useMemo<boolean>(() => rawConfigDiff !== rawConfig, [
    rawConfigDiff,
    rawConfig,
  ]);

  useResize((ev) => {
    if (selectedIndex === 3 && (ev.currentTarget as Window).innerWidth > 1024) {
      setSelectedIndex(0);
    }
  }, { deps: [], enabled: selectedIndex === 3 });

  return (
    <>
      <style>
        {`body > #__aleph {height: 100vh}`}
      </style>
      <Header />
      <main className="h-[calc(100%_-_61px)] grid lg:grid-cols-2 overflow-hidden">
        <div className="h-full flex flex-col lg:border-r border-slate-900/10">
          <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
            <div className="py-1 px-4 lg:pl-8 flex justify-between">
              <Tab.List className="space-x-2">
                {tabs.map(({ name, className, icon, ...rest }) => (
                  <Tab
                    key={name}
                    {...rest}
                    className={({ selected }) =>
                      clsx(
                        { "text-amber-500 italic": selected },
                        className,
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
                  </Tab>
                ))}
              </Tab.List>

              <section>
                <button
                  disabled={!enabledSave}
                  onClick={save}
                  className={clsx(
                    "disabled:text-gray-400 i-mdi-content-save text-teal-500",
                    {
                      "hidden": selectedIndex !== 1,
                    },
                  )}
                  title="save"
                />
              </section>
            </div>

            <Tab.Panels className="flex-1">
              <Tab.Panel className="h-full">
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
              </Tab.Panel>
              <Tab.Panel className="h-full">
                <Editor
                  options={editorOptions}
                  loading={<></>}
                  defaultLanguage="typescript"
                  onChange={(value) => setRawConfig(value ?? "")}
                  value={rawConfig}
                  theme={theme}
                  onMount={handleMound}
                />
              </Tab.Panel>
              <Tab.Panel className="h-full">
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
              </Tab.Panel>
              <Tab.Panel className="h-full">
                {error
                  ? <Err file="config" className="h-full" e={error} />
                  : cssStyle && input && (
                    <root.div
                      mode="closed"
                      styleSheets={[cssStyle]}
                    >
                      <div
                        className={clsx(
                          "whitespace-pre antialiased overflow-scroll grid place-content-center",
                          darkClass,
                        )}
                        dangerouslySetInnerHTML={{ __html: input }}
                      >
                      </div>
                    </root.div>
                  )}
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
        {error ? <Err file="config" className="hidden lg:block" e={error} />
        : cssStyle && input && (
          <root.div
            mode="closed"
            styleSheets={[cssStyle]}
            className="hidden lg:block"
          >
            <div
              className={clsx(
                "whitespace-pre antialiased overflow-scroll grid place-content-center",
                darkClass,
              )}
              dangerouslySetInnerHTML={{ __html: input }}
            >
            </div>
          </root.div>
        )}
      </main>
    </>
  );
}
