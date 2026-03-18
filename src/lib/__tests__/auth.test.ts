import { test, expect, vi, beforeEach } from "vitest";

const { mockSet, mockGet, mockDelete, mockSign } = vi.hoisted(() => ({
  mockSet: vi.fn(),
  mockGet: vi.fn(),
  mockDelete: vi.fn(),
  mockSign: vi.fn().mockResolvedValue("mock-jwt-token"),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({ set: mockSet, get: mockGet, delete: mockDelete })
  ),
}));

vi.mock("jose", () => {
  const builder = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  return {
    SignJWT: vi.fn(() => builder),
    jwtVerify: vi.fn(),
  };
});

import { createSession, getSession } from "@/lib/auth";
import { SignJWT, jwtVerify } from "jose";

beforeEach(() => {
  vi.clearAllMocks();
  mockSign.mockResolvedValue("mock-jwt-token");
});

test("createSession sets an httpOnly cookie named auth-token", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockSet).toHaveBeenCalledOnce();
  const [name, , options] = mockSet.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession stores the signed JWT as the cookie value", async () => {
  await createSession("user-123", "test@example.com");

  const [, token] = mockSet.mock.calls[0];
  expect(token).toBe("mock-jwt-token");
});

test("createSession signs JWT with userId and email in the payload", async () => {
  await createSession("user-123", "test@example.com");

  const payload = vi.mocked(SignJWT).mock.calls[0][0];
  expect(payload).toMatchObject({
    userId: "user-123",
    email: "test@example.com",
  });
});

test("createSession sets cookie expiry to 7 days from now", async () => {
  const before = Date.now();
  await createSession("user-123", "test@example.com");
  const after = Date.now();

  const [, , options] = mockSet.mock.calls[0];
  const expires = new Date(options.expires).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  expect(expires).toBeGreaterThanOrEqual(before + sevenDays);
  expect(expires).toBeLessThanOrEqual(after + sevenDays);
});

test("createSession sets secure flag based on NODE_ENV", async () => {
  await createSession("user-123", "test@example.com");

  const [, , options] = mockSet.mock.calls[0];
  expect(options.secure).toBe(process.env.NODE_ENV === "production");
});

// getSession tests

test("getSession returns null when no cookie is set", async () => {
  mockGet.mockReturnValue(undefined);

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns the session payload when token is valid", async () => {
  const payload = { userId: "user-123", email: "test@example.com", expiresAt: new Date() };
  mockGet.mockReturnValue({ value: "valid-token" });
  vi.mocked(jwtVerify).mockResolvedValue({ payload, protectedHeader: { alg: "HS256" } } as any);

  const session = await getSession();
  expect(session).toEqual(payload);
});

test("getSession calls jwtVerify with the token from the cookie", async () => {
  mockGet.mockReturnValue({ value: "my-token" });
  vi.mocked(jwtVerify).mockResolvedValue({ payload: {}, protectedHeader: { alg: "HS256" } } as any);

  await getSession();
  expect(jwtVerify).toHaveBeenCalledOnce();
  expect(vi.mocked(jwtVerify).mock.calls[0][0]).toBe("my-token");
});

test("getSession returns null when jwtVerify throws", async () => {
  mockGet.mockReturnValue({ value: "expired-token" });
  vi.mocked(jwtVerify).mockRejectedValue(new Error("token expired"));

  const session = await getSession();
  expect(session).toBeNull();
});
