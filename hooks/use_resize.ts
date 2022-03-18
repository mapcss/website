import { DependencyList, EffectCallback, useEffect, useRef } from "react";

type Option = {
  /** Whatever enable this effect or not.
   * @default true
   */
  enabled: boolean;

  /** If present, effect will only activate if the values in the list change. */
  deps: DependencyList;
};

const useResize = (
  effect: (ev: UIEvent) => ReturnType<EffectCallback>,
  option: Partial<Option> = { enabled: true },
) => {
  const ref = useRef<ReturnType<EffectCallback>>();

  useEffect(() => {
    if (!option?.enabled) return;

    const fn = (ev: UIEvent) => {
      ref.current = effect(ev);
    };

    window.addEventListener("resize", fn);

    return () => {
      window.removeEventListener("resize", fn);
      ref.current?.();
    };
  }, [option?.enabled, ...option?.deps ?? []]);
};

export default useResize;
