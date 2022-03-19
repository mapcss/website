import React, { useEffect, useMemo, useState } from "react";
import Editor, {
  EditorProps,
  Monaco,
} from "https://esm.sh/@monaco-editor/react?pin=v69";
import root from "https://esm.sh/react-shadow";
import useDebounce from "~/hooks/use_debounce.ts";
import useColorModeValue from "~/hooks/use_color_mode_value.ts";
import useResize from "~/hooks/use_resize.ts";
import { Header } from "~/components/header.tsx";
import { clsx } from "~/deps.ts";
import { Tab } from "https://esm.sh/@headlessui/react@1.5.0?pin=v69";
import { CODE, RAW_CONFIG } from "~/utils/code.ts";

export const editorOptions: EditorProps["options"] = {
  fontFamily: `Menlo, Monaco, 'Courier New', monospace`,
  fontLigatures: true,
  fontSize: 14,
  minimap: { enabled: false },
  tabSize: 2,
};

const tabs: ({ name: string } & JSX.IntrinsicElements["button"])[] = [
  { name: "HTML" },
  { name: "Config" },
  {
    name: "CSS",
  },
  {
    name: "Preview",
    className: "lg:hidden",
  },
];

export default function Playground() {
  const [input, setInput] = useState<string | undefined>(CODE);
  const [cssSheet, setCSSSheet] = useState("");
  const [rawConfig, setRawConfig] = useState<string | undefined>(
    RAW_CONFIG,
  );
  const [selectedIndex, setSelectedIndex] = useState<number>();

  const theme = useColorModeValue("light", "vs-dark");
  const cssStyle = useMemo(() => {
    if (!window.CSSStyleSheet || !cssSheet) return;
    const style = new CSSStyleSheet();
    (style as any).replaceSync(cssSheet);

    return style;
  }, [cssSheet]);

  const [configMonacoEditor, setMonaco] = useState<Monaco>();

  useEffect(() => {
    configMonacoEditor?.languages.typescript.typescriptDefaults
      .setDiagnosticsOptions({
        noSemanticValidation: true,
      });
  }, [configMonacoEditor]);

  const queryWorker = () => {
    const ws = new Worker("./worker.js");
    ws.onmessage = ({ data }) => {
      setCSSSheet(data);
      ws.terminate();
    };
    ws.postMessage({ code: input, rawConfig });
  };

  useEffect(queryWorker, [input]);

  useResize((ev) => {
    if (selectedIndex === 3 && (ev.currentTarget as Window).innerWidth > 1024) {
      setSelectedIndex(0);
    }
  }, { deps: [], enabled: selectedIndex === 3 });

  useDebounce(
    queryWorker,
    { delay: 3000 },
    [rawConfig],
  );

  return (
    <>
      <style>
        {`body > #__aleph {height: 100vh}`}
      </style>
      <Header />
      <main className="h-[calc(100%_-_61px)] grid lg:grid-cols-2 overflow-hidden">
        <div className="h-full flex flex-col">
          <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
            <Tab.List className="py-1 px-4 lg:px-8 space-x-2 shadow">
              {tabs.map(({ name, className, ...rest }) => (
                <Tab
                  key={name}
                  {...rest}
                  className={({ selected }) =>
                    clsx({ "text-amber-500": selected }, className)}
                >
                  {name}
                </Tab>
              ))}
            </Tab.List>
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
                  onChange={setRawConfig}
                  value={rawConfig}
                  theme={theme}
                  onMount={(_, monaco) => setMonaco(monaco)}
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
              <Tab.Panel>
                {cssStyle && input && (
                  <root.div
                    mode="closed"
                    styleSheets={[cssStyle]}
                  >
                    <div
                      className="whitespace-pre antialiased overflow-scroll grid place-content-center"
                      dangerouslySetInnerHTML={{ __html: input }}
                    >
                    </div>
                  </root.div>
                )}
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>

        {cssStyle && input && (
          <root.div
            mode="closed"
            styleSheets={[cssStyle]}
            className="hidden lg:block"
          >
            <div
              className="whitespace-pre antialiased overflow-scroll grid place-content-center"
              dangerouslySetInnerHTML={{ __html: input }}
            >
            </div>
          </root.div>
        )}
      </main>
    </>
  );
}
