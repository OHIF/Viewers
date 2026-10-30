import packageJson from '../package.json';

// Runtime-descriptor contract: the mode id MUST equal the package name.
// Deriving it here makes the contract hold by construction — never hardcode.
export const id = packageJson.name;
