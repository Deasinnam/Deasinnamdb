# vendor/local

- `@genoffice/agent-core/*.js`: IeumOffice v0.12.12 `packages/agent-core/src`의 `redact-core`, `redact-range`,
  `skill-mcp-refs`, `user-skill-names`를 esbuild로 CommonJS 변환한 것(Apache-2.0).
  다시 만들기: `npx esbuild <원본>/packages/agent-core/src/<이름>.ts --bundle --platform=node --format=cjs --target=node20 --outfile=@genoffice/agent-core/<이름>.js`
- `electron-updater/`: 안드로이드판에는 자동 업데이트가 없어 모양만 맞춘 빈 구현.
