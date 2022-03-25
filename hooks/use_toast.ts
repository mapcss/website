import {
  createElement,
  Dispatch,
  Fragment,
  ReactNode,
  SetStateAction,
  useRef,
} from "react";
import useUpdateEffect from "~/hooks/use_update_effect.ts";

export type Context = Pick<State, "duration" | "enqueued" | "id"> & {
  dispose?: () => void;
};

export type State = {
  node: ReactNode;
  enqueued: boolean;
  id: number;
} & Props;

export type Props = {
  duration: number;
  render: (context: Context) => ReactNode;
};

export type StateSet = [State[], Dispatch<SetStateAction<State[]>>];

function useToast(
  [state, setState]: StateSet,
  {
    duration: defaultDuration = 6000,
    render: defaultRender = (() => createElement(Fragment)),
  }: Partial<Props> = {},
) {
  const idRef = useRef(0);

  const handler = ({ duration, render }: Partial<Props>) => {
    const id = idRef.current;
    idRef.current++;
    setState((state) => {
      const _duration = duration ?? defaultDuration;
      const context: Context = { id, enqueued: false, duration: _duration };
      const _render = render ?? defaultRender;
      return [...state, {
        node: _render(context),
        render: _render,
        ...context,
      }];
    });
  };

  useUpdateEffect(() => {
    if (!state.some(({ enqueued }) => !enqueued)) return;

    setState((state) =>
      state.map((value) => {
        if (value.enqueued) {
          return value;
        }

        const dispose = (): void => {
          setState((state) => state.filter(({ id }) => id !== value.id));
        };
        setTimeout(dispose, value.duration);

        return {
          ...value,
          enqueued: true,
          node: value.render({ ...value, dispose, enqueued: true }),
          dispose,
        };
      })
    );
  }, [state]);
  return handler;
}

export default useToast;
