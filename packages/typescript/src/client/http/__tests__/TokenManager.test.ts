import { describe, it, expect, vi } from "vitest";
import { TokenManager } from "../TokenManager";

describe("TokenManager", () => {
  describe("constructor", () => {
    it("should initialize with no auth", () => {
      const manager = new TokenManager();
      expect(manager.hasAuth()).toBe(false);
    });

    it("should initialize with static token", () => {
      const manager = new TokenManager({ type: "static", token: "my-token" });
      expect(manager.hasAuth()).toBe(true);
    });

    it("should initialize with dynamic token provider", () => {
      const manager = new TokenManager({
        type: "dynamic",
        getToken: () => "dynamic-token",
      });
      expect(manager.hasAuth()).toBe(true);
    });
  });

  describe("getToken", () => {
    it("should return undefined when no auth configured", async () => {
      const manager = new TokenManager();
      const token = await manager.getToken();
      expect(token).toBeUndefined();
    });

    it("should return static token", async () => {
      const manager = new TokenManager({ type: "static", token: "static-token" });
      const token = await manager.getToken();
      expect(token).toBe("static-token");
    });

    it("should call sync dynamic token provider", async () => {
      const getToken = vi.fn(() => "sync-dynamic-token");
      const manager = new TokenManager({ type: "dynamic", getToken });

      const token = await manager.getToken();

      expect(token).toBe("sync-dynamic-token");
      expect(getToken).toHaveBeenCalledTimes(1);
    });

    it("should call async dynamic token provider", async () => {
      const getToken = vi.fn(async () => "async-dynamic-token");
      const manager = new TokenManager({ type: "dynamic", getToken });

      const token = await manager.getToken();

      expect(token).toBe("async-dynamic-token");
      expect(getToken).toHaveBeenCalledTimes(1);
    });

    it("should call dynamic provider each time getToken is called", async () => {
      let callCount = 0;
      const getToken = vi.fn(() => `token-${++callCount}`);
      const manager = new TokenManager({ type: "dynamic", getToken });

      expect(await manager.getToken()).toBe("token-1");
      expect(await manager.getToken()).toBe("token-2");
      expect(await manager.getToken()).toBe("token-3");
      expect(getToken).toHaveBeenCalledTimes(3);
    });
  });

  describe("setToken", () => {
    it("should update static token", async () => {
      const manager = new TokenManager({ type: "static", token: "old-token" });

      manager.setToken("new-token");

      expect(await manager.getToken()).toBe("new-token");
    });

    it("should replace dynamic provider with static token", async () => {
      const getToken = vi.fn(() => "dynamic-token");
      const manager = new TokenManager({ type: "dynamic", getToken });

      manager.setToken("static-token");

      expect(await manager.getToken()).toBe("static-token");
      expect(getToken).not.toHaveBeenCalled();
    });

    it("should set token when no auth was configured", async () => {
      const manager = new TokenManager();
      expect(manager.hasAuth()).toBe(false);

      manager.setToken("new-token");

      expect(manager.hasAuth()).toBe(true);
      expect(await manager.getToken()).toBe("new-token");
    });
  });

  describe("hasAuth", () => {
    it("should return false with no auth", () => {
      const manager = new TokenManager();
      expect(manager.hasAuth()).toBe(false);
    });

    it("should return true with static token", () => {
      const manager = new TokenManager({ type: "static", token: "token" });
      expect(manager.hasAuth()).toBe(true);
    });

    it("should return true with dynamic provider", () => {
      const manager = new TokenManager({
        type: "dynamic",
        getToken: () => "token",
      });
      expect(manager.hasAuth()).toBe(true);
    });
  });
});
