// Stub module for Node.js built-ins that are unavailable in the browser.
// Used by Turbopack resolveAlias to prevent "Can't resolve 'fs'" errors
// when bundling packages like @rdkit/rdkit that have conditional Node code.
export {}
