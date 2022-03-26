export async function loadVersion(): Promise<
  { latest: string; versions: string[] }
> {
  const res = await fetch("https://cdn.deno.land/mapcss/meta/versions.json");
  return await res.json();
}
