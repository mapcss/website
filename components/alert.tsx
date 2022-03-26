import React, { ReactNode } from "react";
import { clsx } from "~/deps.ts";

type Props = {
  icon: ReactNode;
  children: ReactNode;
  close: ReactNode;
  onClose: JSX.IntrinsicElements["button"]["onClick"];
} & JSX.IntrinsicElements["div"];
function Alert(
  {
    children,
    onClose,
    icon,
    close,
    className,
    ...rest
  }: Partial<Props>,
): JSX.Element {
  return (
    <div
      className={clsx(
        "fixed z-1 inset-x-0 right-0 flex sm:left-auto text-green-50 bottom-0 sm:bottom-4 sm:right-4 transition shadow border border-green-700 p-2 sm:rounded-md duration-1000 space-x-2 bg-green-800",
        className,
      )}
      {...rest}
    >
      {icon}
      <div className="flex-1">{children}</div>
      {close}
    </div>
  );
}

export default Alert;
