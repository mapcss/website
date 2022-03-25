import { createContext, Dispatch, SetStateAction } from "react";
import { UseNodeReturn } from "~/hooks/use_node.ts";
import { StateSet as ToastStateSet } from "~/hooks/use_toast.ts";

const F = (): boolean => false;
const vfn = () => {};

export const DarkModeContext = createContext<
  [boolean, Dispatch<SetStateAction<boolean>>]
>([false, F]);
export const OverlayContext = createContext<UseNodeReturn>([
  undefined,
  { on: vfn, off: vfn, toggle: vfn },
]);
export const ToastContext = createContext<ToastStateSet>([[], () => {}]);
