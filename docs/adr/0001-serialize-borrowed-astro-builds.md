# Serialize verification builds using borrowed Astro dependencies
**2026-10-01** · PR #

The free-time article verification exposed a shared cache race: the content checker and renderer both build and borrow the main checkout's dependency directory. Run them sequentially when they share that directory.

Parallel checks were rejected because they both write Astro's content store. Separate dependency installations were rejected because they would duplicate dependencies just to run two short checks. Sequential verification is sufficient and keeps the current borrowed-dependency convention.

See `docs/references/astro-shared-build-cache-pitfall.md` for the observed rename error and reproduction. The public article describes the app UI change; this tooling incident belongs in verification documentation.
