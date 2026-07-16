// Test-only stand-in for the "server-only" package. Next.js aliases the real
// package to a throwing shim in browser bundles; under vitest there's no such
// bundler-level alias, so vitest.config.mts points "server-only" at this
// no-op instead, purely so server-only-marked modules (e.g. api/server-client.ts)
// can be imported by their test files.
export {};
