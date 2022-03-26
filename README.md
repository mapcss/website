# MapCSS Website

## How to use

Check the manual command

```bash
deno run -A https://deno.land/x/aleph/cli.ts -h
```

## Component

- [Deno](https://deno.land/)
- [Aleph.js](https://alephjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [MDX2](https://mdxjs.com/)
- [React17](https://reactjs.org/)
- [MapCSS](https://mapcss.miyauchi.dev/)

## Env

- `MEASUREMENT_ID` - Google Analytics measurement ID

## Polyfill

- [`CSSStyleSheet`](https://github.com/calebdwilliams/construct-style-sheets) at
  `/playground`
- [`Object#hasOwn`](https://github.com/tc39/proposal-accessible-object-hasownproperty/blob/main/polyfill.js)
  at `/worker.js`
