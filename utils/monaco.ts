import { createElement, Fragment } from "react";
import { CODE } from "~/utils/code.ts";
import { deepMerge, EditorProps, OnMount } from "~/deps.ts";

/** Autocomplete close tag
 * @see https://qiita.com/Naoto9282/items/deb735440b45853950b3
 */
export function autoCloseTag(editor: Parameters<OnMount>[0]): void {
  editor.onKeyUp((event) => {
    const keyCode = event.keyCode;
    if (keyCode !== 84) return;

    const model = editor.getModel();
    if (!model) return;
    const position = editor.getPosition();
    if (!position) return;

    const codePre = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    const tag = codePre.match(/.*<(\w+)>$/)?.[1];
    if (!tag) return;

    editor.trigger("bra", "type", {
      text: `</${tag}>`,
    });

    editor.setPosition(position);
  });
}

export const makeJSONEditorProps = (props: EditorProps): EditorProps => ({
  defaultLanguage: "json",
  wrapperProps: { className: "flex-1" },
  options: {
    readOnly: true,
    minimap: {
      enabled: false,
    },
  },
  loading: createElement(Fragment),
  ...props,
});

const baseEditorProps = {
  options: {
    fontFamily: `Menlo, Monaco, 'Courier New', monospace`,
    fontSize: 13,
    tabSize: 2,
    minimap: {
      enabled: false,
    },
  },
  loading: createElement(Fragment),
};

export const htmlEditorProps: EditorProps = deepMerge(baseEditorProps, {
  defaultLanguage: "html",
  defaultValue: CODE,
});

export const tsEditorProps: EditorProps = deepMerge(baseEditorProps, {
  defaultLanguage: "typescript",
});

export const JSONEditorProps: EditorProps = deepMerge(baseEditorProps, {
  language: "json",
  wrapperProps: { className: "flex-1" },
  options: {
    readOnly: true,
  },
});

export const CSSEditorProps: EditorProps = deepMerge(baseEditorProps, {
  language: "css",
  options: {
    readOnly: true,
  },
});
