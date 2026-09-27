---
name: Generated API client body types
description: Compiler requirement that appears when OpenAPI gains request-body operations.
---

When OpenAPI operations include request bodies, the generated React client uses `Headers.entries()`, so the client library TypeScript config must include `dom.iterable` alongside `dom`.

**Why:** The initial client generated successfully without body operations, then workspace typechecking failed only after webhook mutations were added.

**How to apply:** If codegen starts emitting request-body helpers and `Headers.entries` fails, update the shared client compiler libs before changing generated output.