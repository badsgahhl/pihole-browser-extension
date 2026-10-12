# Pi-hole API specification

`upstream/` holds the OpenAPI files of Pi-hole FTL, copied verbatim from
`src/api/docs/content/specs/` in [pi-hole/FTL](https://github.com/pi-hole/FTL) at the tag in `FTL_VERSION`.
The file names must stay as upstream ships them because `main.yaml` references its siblings by name.

`pihole-api.bundled.json` is generated: Redocly bundles the upstream files into one document, then
`scripts/generate-api.ts` renames the `operationId` of `DELETE /auth` from the upstream `delete_groups`
to `logout`. From that document `@hey-api/openapi-ts` writes the client in `src/lib/api/pihole/`.

Both the bundled document and the generated client are committed, so building the extension needs no
network and the AMO reviewer can rebuild it offline. CI regenerates them and fails if they drift.

## Updating to a newer FTL release

```bash
echo v6.x.y > api-spec/FTL_VERSION
pnpm generate:api --fetch
git diff --stat
```

Review the diff of `src/lib/api/pihole/types.gen.ts` for changes to the endpoints the extension uses
(`/auth`, `/dns/blocking`, `/info/version`, `/info/messages/count`, `/stats/summary`, `/search/{domain}`,
`/domains/{type}/{kind}`), run the tests, and commit everything together.
