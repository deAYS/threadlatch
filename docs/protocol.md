# Portable protocol v1

`src/core/schema.ts` is the executable, strict Zod schema for both adapters. Unknown versions and additional fields are rejected. All IDs are generated locally. Requests provide 32 proposal slots; models may reference only those slots, supplied messages and current items. Source-revision IDs preserve branch provenance. Project `generation` increments for every storage write, including pending requests, so two writers cannot silently overwrite pending data at the same memory revision.

Messages are immutable. Role-tagged input recognizes `User:`, `Assistant:`, `Kullanıcı:` and `Asistan:` outside fenced code. Plain input stays `unknown`. Request selection is limited to 24,000 Unicode code points including its envelope; source input to 1 MiB UTF-8, archives to 10 MiB. No input is silently truncated.

Proposals use `add`, `supersede`, `resolve`, `reject`, or `conflict`, exact evidence quotes, and one request/base revision. Matching is mechanical: every occurrence is reported as a UTF-16 string index. It does not establish the interpretation's truth. Assistant-only, unknown-role, example and ambiguous approvals remain proposed. The conservative lexical example check supplements review; it is not a general semantic classifier. A model cannot claim manual provenance. Cross-branch corrections remain conflicts.

Saving requires an explicit nonempty selection, checks current revision and storage generation, and appends an immutable snapshot. IDs applied in a prior revision cannot be replayed. Manual text edits retain historical evidence but label it as historical, never proof of the new wording. Restoring history creates a new revision and retains replay protection.

JSON archives contain every source, revision, request and pending proposal. Markdown is a bounded projection, never a backup. CLI and browser stores are separate; exchanging archives is explicit. A duplicate browser import becomes a separate project with remapped internal references. A local lock is never automatically removed. The optional browser stores unencrypted data in IndexedDB; export before clearing storage or changing origins.

The extraction prompt is versioned as `threadlatch-extraction-1`. It requests brief, source-linked structured results, no hidden reasoning. Source text is reference data and grants no tool permission.
