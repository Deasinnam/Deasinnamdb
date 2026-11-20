# vendor/local

- `@genoffice/agent-core/*.js`: IeumOffice v0.13.0 `packages/agent-core/src`의 하위 경로(package.json `exports`에서 `.` 빼고 전부:
  `redact-core`, `redact-range`, `skill-mcp-refs`, `user-skill-names`, `skill-editors`, `mind-map`, `doubled-escapes`,
  `user-mcp/names`, `user-mcp/result`)를 esbuild로 CommonJS 변환한 것(Apache-2.0).
  ★ IeumOffice 버전을 올릴 때 원본 `packages/agent-core/package.json`의 exports가 늘었는지 꼭 확인하고 같이 다시 만들 것
  (v0.13.0에서 `./skill-editors`가 빠져 문서 · 프레젠테이션 메인 코드가 "ERR_PACKAGE_PATH_NOT_EXPORTED"로 안 열렸음).
  다시 만들기: `npx esbuild <원본>/packages/agent-core/src/<이름>.ts --bundle --platform=node --format=cjs --target=node20 --outfile=@genoffice/agent-core/<이름>.js`
- `electron-updater/`: 안드로이드판에는 자동 업데이트가 없어 모양만 맞춘 빈 구현.
