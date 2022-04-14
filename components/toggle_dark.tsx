import { useContext } from "react";
import { clsx } from "~/deps.ts";
import Switch from "~/components/switch.tsx";
import { DarkModeContext } from "~/contexts/mod.ts";

const ToggleDark = (): JSX.Element => {
  const [enabled, setEnabled] = useContext(DarkModeContext);

  return (
    <Switch
      checked={enabled}
      onChange={setEnabled}
      title="Switch dark mode"
      className={clsx(
        "relative inline-flex flex-shrink-0 h-[24px] w-[48px] border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75",
        { "bg-white": enabled },
        { "bg-dark-900": !enabled },
      )}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={clsx(
          "pointer-events-none inline-flex items-center justify-center h-[20px] w-[20px] rounded-full bg-white dark:bg-black shadow-lg transform transition ease-in-out duration-200",
          { "translate-x-6": enabled },
          { "translate-x-0": !enabled },
        )}
      >
        <span
          className={clsx(
            "w-3.5 h-3.5 transition-all duration-200",
            enabled ? "i-mdi-weather-night" : "i-mdi-white-balance-sunny",
          )}
        />
      </span>
    </Switch>
  );
};

export default ToggleDark;
