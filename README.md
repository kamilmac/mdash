# mdash

Markdown in a URL. No server, no database, no accounts. Write markdown, get a shareable link.

**Live:** [kamilmac.github.io/mdash](https://kamilmac.github.io/mdash/)

## How it works

1. Write markdown in the editor
2. Content is compressed with [lz-string](https://github.com/pieroxy/lz-string) and stored in the URL fragment (`#`)
3. Share the link — anyone who opens it sees the rendered page
4. The fragment never leaves the browser. No data hits any server.
