import {
  MouseEventHandler,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import useColorModeValue from "~/hooks/use_color_mode_value.ts";
import useResize from "~/hooks/use_resize.ts";
import { Header } from "~/components/header.tsx";
import {
  clsx,
  Editor,
  OnMount,
  Tab,
  TabList,
  TabPanel,
  TabProvider,
} from "~/deps.ts";
import { CODE, CSS, RAW_CONFIG, TYPES } from "~/utils/code.ts";
import { dynamic } from "aleph/react";
import useUpdateEffect from "~/hooks/use_update_effect.ts";
import { autoCloseTag } from "~/utils/monaco.ts";
import { BASE_ISSUE_URL } from "~/utils/constant.ts";
import { ToastContext } from "~/contexts/mod.ts";
import useToast from "~/hooks/use_toast.ts";
import { getParam, useVersion } from "~/hooks/use_mapcss.ts";
import useRender, { Renderer } from "~/hooks/use_render.ts";
import {
  CSSEditorProps,
  htmlEditorProps,
  JSONEditorProps,
  tsEditorProps,
} from "~/utils/monaco.ts";

import type { Data, ErrorLike, Message } from "~/utils/message.ts";
import {
  getBrowserVersion,
  getIssueReportUrl,
  handleOnRender,
  Loading,
  makeShareURL,
  makeStatusClassName,
  makeStatusMessage,
  previewTabs,
  Result,
  shadowRootProps,
  tabs,
  useToken,
} from "~/components/playground/right_panel.tsx";

import "https://unpkg.com/construct-style-sheets-polyfill";

const DESCRIPTION =
  `An online playground for MapCSS lets you use all of MapCSS's features directly in the browser.`;
const TITLE = `MapCSS Playground`;
const BASE_URL = `https://mapcss.miyauchi.dev`;
const OG_IMAGE = `${BASE_URL}/hero-playground.png`;
const Err = dynamic(() => import("~/components/err.tsx"));
const Alert = dynamic(() => import("~/components/alert.tsx"));
const IssueForm = dynamic(() => import("~/components/issue_form.tsx"));
const ShadowRoot = dynamic(() => import("~/components/shadow_root.tsx"));

export default function Playground(): JSX.Element {
  const { version, setVersion, latestVersions } = useVersion();
  const [globalCSS] = useState<string>(CSS);
  const [token, setToken] = useToken();
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
        setCSSSheet(data.value.css);
        setToken(data.value.token);
      } else {
        setResult({ status: "wait", type: data.value });
      }
    };
    const data: Data = {
      input,
      config: rawConfigDiff,
      version,
      css: globalCSS,
    };
    worker.postMessage(data);
  }, [worker, input, rawConfigDiff, version]);

  const handleClick: MouseEventHandler = async () => {
    const runtime = getBrowserVersion();
    const data: Data = {
      input,
      config: rawConfigDiff,
      version,
      css: globalCSS,
    };
    const url = await getIssueReportUrl({
      ...data,
      runtime,
    });
    const playgroundLink = await makeShareURL(data);

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
                <p className="text-center">
                  The data to be sent to GitHub was too large.
                </p>
                <p className="text-center">
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
                <hr className="my-4" />
                <IssueForm
                  {...{
                    ...data,
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
  };

  const handleShareLink: MouseEventHandler = async () => {
    const url = await makeShareURL({
      input,
      config: rawConfigDiff,
      version,
      css: globalCSS,
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
  };
  const [result, setResult] = useState<Result>({ status: "wait" });
  const waitingMsg = useMemo(() => {
    if (result.status !== "wait") return;
    return makeStatusMessage(result.type);
  }, [result]);

  const classNameMsg = useMemo(() => {
    if (result.status !== "wait") return;
    return makeStatusClassName(result.type);
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
  }, { deps: [], enabled: [2, 3, 4].includes(select) });

  return (
    <>
      <Head />
      <div className="h-screen overflow-hidden flex flex-col">
        <Header className="flex-none" />
        <main className="lg:grid flex-1 grid-cols-2">
          <div className="h-full flex flex-col lg:border-r border-slate-900/10">
            <div role="toolbar" className="justify-between flex">
              <TabList className="overflow-x-scroll flex-1 flex">
                {tabs.map(({ name, className, icon, ...rest }, i) => (
                  <Tab
                    isSelected={select === i}
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
                  </Tab>
                ))}
              </TabList>

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
                  onClick={handleClick}
                  className="group relative space-x-2 rounded-md inline-flex p-1 border-1 border-slate-900/10 dark:border-slate-300/10 hover:bg-gray-100 dark:hover:bg-dark-300 focus:ring-1 ring-amber-500 transition duration-200"
                >
                  <span className="i-mdi-bug w-4 h-4" />
                  <span className="text-sm hidden lg:group-hover:block absolute mt-9 -translate-x-1/2 -translate-y-1/2 bg-white shadow dark:bg-dark-900 border border-gray-200 dark:border-dark-100 rounded-md px-1 z-1">
                    Report issue
                  </span>
                </button>
                <button
                  onClick={handleShareLink}
                  className="group relative space-x-2 rounded-md inline-flex p-1 border-1 border-slate-900/10 dark:border-slate-300/10 hover:bg-gray-100 dark:hover:bg-dark-300 focus:ring-1 ring-amber-500 transition duration-200"
                >
                  <span className="i-mdi-share-variant w-4 h-4" />
                  <span className="text-sm hidden lg:group-hover:block absolute mt-9 -translate-x-1/2 -translate-y-1/2 bg-white shadow dark:bg-dark-900 border border-gray-200 dark:border-dark-100 rounded-md px-1 z-1">
                    Share URL
                  </span>
                </button>
              </section>
            </div>

            <TabPanel className="flex-1">
              {select === 0
                ? (
                  <Editor
                    {...htmlEditorProps}
                    onChange={(v) => setInput(v ?? "")}
                    onMount={(editor) => autoCloseTag(editor)}
                    value={input}
                    theme={theme}
                  />
                )
                : select === 1
                ? (
                  <Editor
                    {...tsEditorProps}
                    onChange={(value) => setRawConfig(value ?? "")}
                    value={rawConfig}
                    theme={theme}
                    onMount={handleMount}
                  />
                )
                : [2, 3, 4].includes(select)
                ? result.status === "wait"
                  ? (
                    <Loading
                      className={classNameMsg}
                      message={waitingMsg}
                    />
                  )
                  : result.status === "success"
                  ? select === 2
                    ? cssStyle && input && (
                      <ShadowRoot
                        {...shadowRootProps}
                        onRender={handleOnRender(cssStyle)}
                      >
                        <div
                          className={clsx("h-full", darkClass)}
                          dangerouslySetInnerHTML={{ __html: input }}
                        />
                      </ShadowRoot>
                    )
                    : select === 3
                    ? (
                      <Editor
                        {...CSSEditorProps}
                        value={cssSheet}
                        theme={theme}
                      />
                    )
                    : (
                      <Editor
                        {...JSONEditorProps}
                        value={token}
                        theme={theme}
                      />
                    )
                  : result.status === "error"
                  ? error && <Err file="config" className="h-full" e={error} />
                  : <></>
                : <></>}
            </TabPanel>
          </div>

          <div className="h-full hidden lg:flex flex-col">
            {result.status === "wait"
              ? (
                <Loading
                  className={classNameMsg}
                  message={waitingMsg}
                />
              )
              : result.status === "success"
              ? cssStyle && input && (
                <TabProvider>
                  <div
                    role="toolbar"
                    className="flex flex-row-reverse h-[30px] shadow flex-none"
                  >
                    <TabList className="flex">
                      {previewTabs.map((
                        { name, icon, className, ...rest },
                      ) => (
                        <Tab
                          renderProps={({ isSelected }) => ({
                            className: clsx(
                              "space-x-1 px-3 border-b-1",
                              className,
                              isSelected
                                ? "border-amber-500"
                                : "border-transparent",
                            ),
                          })}
                          {...rest}
                          key={name}
                        >
                          <span className={icon} />
                          <span>{name}</span>
                        </Tab>
                      ))}
                    </TabList>
                  </div>
                  <TabPanel className="flex-1">
                    <ShadowRoot
                      {...shadowRootProps}
                      onRender={handleOnRender(cssStyle)}
                    >
                      <div
                        className={clsx("h-full", darkClass)}
                        dangerouslySetInnerHTML={{ __html: input }}
                      />
                    </ShadowRoot>
                  </TabPanel>
                  <TabPanel className="flex-1">
                    <Editor
                      {...CSSEditorProps}
                      value={cssSheet}
                      theme={theme}
                    />
                  </TabPanel>
                  <TabPanel className="flex-1">
                    <Editor
                      {...JSONEditorProps}
                      value={token}
                      theme={theme}
                    />
                  </TabPanel>
                </TabProvider>
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

function Head(): JSX.Element {
  return (
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
  );
}
