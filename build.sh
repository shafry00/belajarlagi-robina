#!/bin/sh
# Rakit src/ menjadi satu file index.html (self-contained)
cd "$(dirname "$0")"
{ cat src/head.html src/body.html; printf '<script>\n'; cat src/engine.js; printf '\n</script>\n<script>\n'; cat src/app.js; printf '\n</script>\n</body></html>\n'; } > index.html
echo "OK: index.html ($(wc -c < index.html) bytes)"
