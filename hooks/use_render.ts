import {
  createElement,
  Dispatch,
  Fragment,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import useId from "~/hooks/use_id.ts";

export type State = {
  id: number;
  node: ReactNode;
  fn: (context: Context) => ReactNode;
  ready: boolean;
};

export type Context =
  & {
    id: number;
  }
  & (
    | { ready: false; unmount?: () => void }
    | { ready: true; unmount: () => void }
  );

export type Return = [
  nodes: State[],
  render: (props: { fn: (context: Context) => ReactNode }) => void,
];

const useRender = (
  stateSet: [State[], Dispatch<SetStateAction<State[]>>] = useState<State[]>(
    [],
  ),
): Return => {
  const [state, setState] = stateSet;
  const { inc } = useId();

  const render = ({ fn }: { fn: (context: Context) => ReactNode }) => {
    const id = inc();
    const context: Context = { id, ready: false };
    const node = fn(context);
    setState((value) => [...value, { ...context, node, fn }]);
  };

  useEffect(() => {
    if (!state.some(({ ready }) => !ready)) return;
    setState((state) =>
      state.map((value) => {
        if (value.ready) {
          return value;
        }

        const unmount = (): void => {
          setState((state) => state.filter(({ id }) => id !== value.id));
        };

        const context = { ...value, ready: true, unmount };

        return {
          ...context,
          node: value.fn(context),
        };
      })
    );
  }, [state]);

  return [state, render];
};

export default useRender;

export function Renderer(
  { children, ...rest }: { children: { id: number; node: ReactNode }[] },
): JSX.Element {
  return createElement(
    Fragment,
    {},
    children.map(({ node, id }) =>
      createElement("div", { ...rest, key: id }, node)
    ),
  );
}
