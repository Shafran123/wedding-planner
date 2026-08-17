import { vi } from "vitest";

vi.mock("../../src/firebaseAuth.js", () => ({
  verifyIdToken: async (token: string) => {
    if (!token.startsWith("test-token:")) {
      throw new Error("invalid-token");
    }
    const [, uid, email, name] = token.split(":");
    return {
      uid,
      email: email || `${uid}@test.com`,
      name: name || `User ${uid}`,
      picture: undefined,
    };
  },
}));
