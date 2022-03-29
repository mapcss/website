import React, { Fragment, useMemo, useState } from "react";
import { clsx, EditorProps } from "~/deps.ts";
import { encode } from "https://deno.land/std@0.131.0/encoding/base64url.ts";
import parser from "https://deno.land/x/ua_parser_js@1.0.2/src/ua-parser.js";
import { BASE_ISSUE_URL } from "~/utils/constant.ts";

import type { Data } from "~/utils/message.ts";
import type { OnRender } from "~/components/shadow_root.tsx";

type Props = {
  status: "wait" | "success" | "error";
};

export function Loading(
  { message, className }: Partial<{ message: string; className: string }>,
) {
  return (
    <div className="h-full grid place-items-center">
      <div
        className={clsx(
          "flex flex-col items-center space-y-2",
          className,
        )}
      >
        <span className="i-mdi-loading animate-spin w-12 h-12" />
        <span className="text-xl">{message}</span>
      </div>
    </div>
  );
}

export const shadowRootProps = {
  mode: "closed" as const,
  className: "h-full",
};

export const handleOnRender = (StyleSheet: StyleSheet): OnRender =>
  (root) => {
    (root as any).adoptedStyleSheets = [StyleSheet];
  };

export const makeJSONEditorProps = (props: EditorProps): EditorProps => ({
  defaultLanguage: "json",
  wrapperProps: { className: "flex-1" },
  options: {
    readOnly: true,
    minimap: {
      enabled: false,
    },
  },
  loading: Fragment,
  ...props,
});

const useResult = (result: Result) => {
  const waitingMsg = useMemo(() => {
    if (result.status !== "wait") return;
    switch (result.type) {
      case "init": {
        return "Initialize TypeScript Compiler...";
      }
      case "compile": {
        return "Compile config...";
      }
      case "import": {
        return "Fetch modules, live binding...";
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
        return "text-blue-600";
      }
      case "import": {
        return "text-amber-500";
      }
      default: {
        return "text-teal-500";
      }
    }
  }, [result]);
};

export type StatusType = "init" | "import" | "compile";

export const makeStatusClassName = (type?: StatusType): string => {
  switch (type) {
    case "init":
    case "compile": {
      return "text-blue-600";
    }
    case "import": {
      return "text-amber-500";
    }
    default: {
      return "text-teal-500";
    }
  }
};

export const makeStatusMessage = (type?: StatusType): string => {
  switch (type) {
    case "init": {
      return "Initialize TypeScript Compiler...";
    }
    case "compile": {
      return "Compile config...";
    }
    case "import": {
      return "Fetch modules, live binding...";
    }
    default: {
      return "Processing...";
    }
  }
};

export type Result =
  | {
    status: "success";
  }
  | { status: "error" }
  | { status: "wait"; type?: "init" | "import" | "compile" };

export async function getIssueReportUrl({
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

export function getBrowserVersion(): string {
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

export const makeShareURL = async (
  { input, config, version }: Data,
): Promise<URL> => {
  const url = new URL(window.location.href);

  url.searchParams.set("input", encode(input));
  url.searchParams.set("config", encode(config));
  url.searchParams.set("version", encode(version));
  return url;
};

export const tabs:
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

export const previewTabs:
  ({ name: string; icon: string } & JSX.IntrinsicElements["button"])[] = [
    {
      name: "preview",
      icon: "i-mdi-tablet-dashboard w-4 h-4",
    },
    {
      name: "token",
      icon: "i-mdi-arrow-decision-auto-outline w-4 h-4",
    },
  ];

export const useToken = () => {
  const [state, setState] = useState<Set<string> | string>("");

  const token = useMemo<string>(() => {
    return JSON.stringify(Array.from(state), undefined, 2);
  }, [state]);
  return [token, setState] as const;
};
