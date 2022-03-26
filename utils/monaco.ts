import type { OnMount } from "https://esm.sh/@monaco-editor/react@4.3.1?deps=monaco-editor@0.33.0,react@17.0.2&pin=v69";
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
