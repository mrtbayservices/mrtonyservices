# Mr. Tony Services

Website for Mr. Tony Services (Concord, CA) — HTML, CSS and JavaScript.

## How it works

```mermaid
flowchart TD
  V([Visitor]) -->|views| H[index.html]
  H -->|styled by| C[style.css]
  H -->|enhanced by| J[main.js]
  J -->|handles| F[Estimate form]
  F -->|submits request| W{{Web3Forms API}}
  F -->|fallback| E[Visitor email app]
```

## Files
- `index.html` — page content
- `css/style.css` — design
- `js/main.js` — menu, animations, estimate form