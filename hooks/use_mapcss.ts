import { useEffect, useMemo, useState } from "react";
import { loadVersion } from "~/utils/load.ts";
import { useDeno } from "aleph/react";
import { decode } from "https://deno.land/std@0.131.0/encoding/base64url.ts";
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

export const useVersion = () => {
  const defaultAs = useDeno(async () => {
    const { latest } = await loadVersion();
    return latest;
  });
  const [version, setVersion] = useState(() =>
    getParam({ param: "version", defaultAs })
  );
  const [versions, setVersions] = useState([version]);
  const latestVersions = useMemo(() => versions.slice(0, 5), [versions]);
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
