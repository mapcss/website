import React from "react";
import type { Data } from "~/utils/message.ts";

type Props = Data & { playgroundLink: string };
function IssueForm(
  { input, config, version, playgroundLink }: Props,
): JSX.Element {
  return (
    <form className="space-y-6">
      <div>
        <h2 className="text-xl mb-2">
          <label htmlFor="input">Input</label>
        </h2>
        <textarea
          className="w-full h-24 border rounded px-2 py-1"
          readOnly
          value={input}
          id="input"
        />
      </div>

      <div>
        <h2 className="text-xl mb-2">
          <label htmlFor="config">Config</label>
        </h2>
        <textarea
          className="w-full h-24 border rounded px-2 py-1"
          readOnly
          value={config}
          id="config"
        />
      </div>

      <div>
        <h2 className="text-xl mb-2">
          <label htmlFor="playground-link">Playground link</label>
        </h2>
        <input
          id="playground-link"
          className="p-1"
          value={playgroundLink}
          readOnly
        />
      </div>

      <div>
        <h2 className="text-xl mb-2">
          <label htmlFor="version">Version</label>
        </h2>
        <input className="p-1" readOnly value={version} id="version" />
      </div>
    </form>
  );
}

export default IssueForm;
