import type { Plugin } from "aleph/types";

export default function googleAnalytics(id?: string): Plugin {
  return {
    name: "google-analytics-plugin",
    setup: (aleph) => {
      if (id && aleph.mode === "production") {
        aleph.onRender(({ html }) => {
          html.scripts.push(
            {
              src: `https://www.googletagmanager.com/gtag/js?id=${
                encodeURIComponent(id)
              }`,
              async: true,
            },
            `
              window.dataLayer = window.dataLayer || [];
              function gtag() {
                dataLayer.push(arguments);
              }
              gtag('js', new Date());
              gtag('config', ${JSON.stringify(id)});
            `,
          );
        });
      }
    },
  };
}
