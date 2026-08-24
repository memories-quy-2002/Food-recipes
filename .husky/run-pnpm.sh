#!/usr/bin/env sh

run_pnpm() {
  if command -v corepack >/dev/null 2>&1; then
    corepack pnpm@11.18.0 "$@"
  elif command -v corepack.cmd >/dev/null 2>&1; then
    corepack.cmd pnpm@11.18.0 "$@"
  elif command -v pnpm >/dev/null 2>&1; then
    pnpm "$@"
  elif command -v pnpm.cmd >/dev/null 2>&1; then
    pnpm.cmd "$@"
  else
    echo "husky: pnpm 11.18.0 or Corepack is required to run the hook" >&2
    return 127
  fi
}
