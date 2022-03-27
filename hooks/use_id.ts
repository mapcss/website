import { useRef } from "react";

type UseIdReturn = {
  id: number;
  inc: () => number;
};
const useId = (initialState: number = 0): UseIdReturn => {
  const ref = useRef(initialState);

  const inc = (step: number = 1): number => {
    ref.current = ref.current + step;
    return ref.current;
  };

  return {
    id: ref.current,
    inc,
  };
};

export default useId;
