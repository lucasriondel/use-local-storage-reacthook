// Main hooks
export {
  useLocalStorageProp,
  useLocalStorageState,
} from "./useLocalStorageState";

// Types
export type {
  Codec,
  CodecsMap,
  DeepPartial,
  LocalStorageApiActions,
  LocalStorageStateOptions,
} from "./types";

// Utility functions - can be imported individually if needed
export { isLocalStorageAvailable } from "./utils/isLocalStorageAvailable";
export { mergeWithDefaults } from "./utils/mergeWithDefaults";
export { readLocalStorage } from "./utils/readLocalStorage";
export { removeLocalStorage } from "./utils/removeLocalStorage";
export { resolveDefaults } from "./utils/resolveDefaults";
export { defaultDeserialize, defaultSerialize } from "./utils/serialization";
export { writeLocalStorage } from "./utils/writeLocalStorage";
