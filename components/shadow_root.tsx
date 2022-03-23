import { createElement, useEffect, useRef } from "react";

export type Props<Tag extends keyof JSX.IntrinsicElements> =
  & {
    children: JSX.Element;
    onRender?: (shadowRoot: ShadowRoot) => void;
    as?: Tag;
  }
  & JSX.IntrinsicElements[Tag]
  & ShadowRootInit;
function ShadowRoot<Tag extends keyof JSX.IntrinsicElements = "div">(
  { children, as, onRender, mode, delegatesFocus, slotAssignment, ...rest }:
    Props<Tag>,
): JSX.Element {
  const ref = useRef<Element>(null);
  const shadowRoot = useRef<ShadowRoot>();
  useEffect(() => {
    if (!ref.current) return;

    if (!shadowRoot.current) {
      shadowRoot.current = ref.current.attachShadow({
        mode,
        delegatesFocus,
        slotAssignment,
      });
    }

    onRender?.(shadowRoot.current);

    import("react-dom").then((mod) => {
      mod.render(children, shadowRoot.current as any);
    });
  }, [children]);
  return createElement(as ?? "div", { ref, ...rest });
}

export default ShadowRoot;
