import { useEffect, useMemo, useState } from "react";
import { loadVersion } from "~/utils/load.ts";
import { useDeno } from "aleph/react";
import { decode } from "https://deno.land/std@0.131.0/encoding/base64url.ts";
import { DEFAULT_VERSION } from "~/utils/constant.ts";
export function getParam(
  { param, defaultAs }: { param: string; defaultAs: string },
): string {
  if (window) {
    const searchParams = new URLSearchParams(window.location.search);
    const _input = searchParams.get(param);
    try {
      const input = _input
        ? new TextDecoder().decode(decode(_input))
        : defaultAs;
      return input;
    } catch {
      return defaultAs;
    }
  } else {
    return defaultAs;
  }
}

const desc = <T extends string | number>(a: T, b: T): number => {
  if (a < b) {
    return 1;
  } else if (a > b) {
    return -1;
  }
  return 0;
};

export const useVersion = () => {
  const defaultAs = useDeno<string | null>(async () => {
    const { latest } = await loadVersion();
    return latest;
  }) ?? DEFAULT_VERSION;
  const [version, setVersion] = useState<string>(() =>
    getParam({ param: "version", defaultAs })
  );
  const [versions, setVersions] = useState([version]);
  const latestVersions = useMemo<string[]>(
    () => [...versions.slice(0, 5)].sort(desc),
    [versions],
  );
  useEffect(() => {
    loadVersion().then(({ versions }) => {
      const v = new Set([defaultAs, ...versions]);
      setVersions(Array.from(v));
    }).catch(() => {});
  }, []);

  return {
    version,
    setVersion,
    versions,
    latestVersions,
    setVersions,
  };
};
