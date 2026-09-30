# Borrowed Astro caches need sequential builds

## Symptom

During the October 1 free-time article update, running the devlog content check and page render check together made one build fail with `ENOENT` while renaming `node_modules/.astro/data-store.json.tmp` to `data-store.json`. The article itself was valid; the sequential retry passed.

## Mechanism and evidence

Both helpers run `npm run build`. Both borrow the primary checkout's `node_modules`, so the Astro content store is shared even when the worktree paths differ. The failed stack passed through `MutableDataStore.writeToDisk` and `Object.rename`. A competing writer can rename the shared temporary file before the other writer does.

## Procedure

Run the content check to completion, then run the render check. Serialize builds that share the borrowed dependency directory. After this particular error, retry sequentially before editing article content or reinstalling dependencies.

## Why it escaped the first check

The two helpers were treated as independent verification tasks because their outputs differ. Their hidden build step writes the same cache. The devlog procedure now explicitly identifies that dependency.

## Reproduction

In a disposable site worktree with borrowed `node_modules`, launch the devlog content check and web page render check concurrently. This is timing dependent: the recorded run failed at the content-store rename. Running the helpers one after another completed the build and rendered both article routes.

## Lesson

Independent reports do not imply independent tools. Inspect build/cache ownership before parallelizing verification helpers.
