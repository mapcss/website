import React from "react";
import type { Data } from "~/utils/message.ts";

type Props = Data & { playgroundLink: string; runtime: string };
function IssueForm(
  { input, config, version, playgroundLink, runtime }: Props,
): JSX.Element {
  return (
    <form className="space-y-6">
      <div>
        <h2 className="text-xl mb-2">
          <label htmlFor="input">Input</label>
        </h2>
        <textarea
          className="w-full h-24"
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
          className="w-full h-24"
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
          value={playgroundLink}
          readOnly
        />
      </div>

      <div>
        <h2 className="text-xl mb-2">
          <label htmlFor="version">Version</label>
        </h2>
        <input readOnly value={version} id="version" />
      </div>
      <div>
        <h2 className="text-xl mb-2">
          <label htmlFor="runtime">Runtime</label>
        </h2>
        <input readOnly value={runtime} id="runtime" />
      </div>
    </form>
  );
}

export default IssueForm;
