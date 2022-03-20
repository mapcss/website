import { DependencyList, EffectCallback, useEffect, useRef } from "react";

type Option = {
  /**
   * @default 0
   */
  delay: number;

  /** deps If present, effect will only activate if the values in the list change. */
  deps: DependencyList;
};
const useDebounce = (
  effect: EffectCallback,
  { delay = 0, deps }: Partial<Option> = {},
) => {
  const ref = useRef<ReturnType<EffectCallback>>();
  useEffect(() => {
    const timerId = setTimeout(() => {
      ref.current = effect();
    }, delay);

    return () => {
      clearTimeout(timerId);
      ref.current?.();
    };
  }, deps);
};

export default useDebounce;
