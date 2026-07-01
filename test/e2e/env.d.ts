// Minimal process typing for the E2E specs (no @types/node dependency).
declare const process: {
  env: Record<string, string | undefined>;
};
