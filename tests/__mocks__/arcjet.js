/**
 * Mock for @arcjet/node used in Jest tests.
 * Arcjet relies on WASM modules that Jest cannot resolve,
 * so we provide a no-op mock that always allows requests.
 */

const mockDecision = {
  isDenied: () => false,
  isAllowed: () => true,
  reason: {
    isBot: () => false,
    isRateLimit: () => false,
    isShield: () => false,
  },
};

const mockArcjetClient = {
  protect: async () => mockDecision,
  withRule: () => mockArcjetClient,
};

const arcjet = () => mockArcjetClient;

export const shield = () => ({});
export const detectBot = () => ({});
export const slidingWindow = () => ({});

export default arcjet;
