import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();

vi.mock("@/actions", () => ({
  signIn: (...args: any[]) => mockSignIn(...args),
  signUp: (...args: any[]) => mockSignUp(...args),
}));

const mockGetAnonWorkData = vi.fn();
const mockClearAnonWork = vi.fn();

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: () => mockGetAnonWorkData(),
  clearAnonWork: () => mockClearAnonWork(),
}));

const mockGetProjects = vi.fn();
vi.mock("@/actions/get-projects", () => ({
  getProjects: () => mockGetProjects(),
}));

const mockCreateProject = vi.fn();
vi.mock("@/actions/create-project", () => ({
  createProject: (...args: any[]) => mockCreateProject(...args),
}));

import { useAuth } from "@/hooks/use-auth";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-project-id" });
});

// --- signIn ---

describe("signIn", () => {
  test("calls signInAction with email and password", async () => {
    mockSignIn.mockResolvedValue({ success: false, error: "Invalid" });

    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signIn("user@test.com", "password123"));

    expect(mockSignIn).toHaveBeenCalledWith("user@test.com", "password123");
  });

  test("returns the result from signInAction", async () => {
    const authResult = { success: false, error: "Invalid credentials" };
    mockSignIn.mockResolvedValue(authResult);

    const { result } = renderHook(() => useAuth());
    const returned = await act(() =>
      result.current.signIn("user@test.com", "wrong")
    );

    expect(returned).toEqual(authResult);
  });

  test("does not navigate when sign-in fails", async () => {
    mockSignIn.mockResolvedValue({ success: false, error: "Invalid" });

    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signIn("user@test.com", "wrong"));

    expect(mockPush).not.toHaveBeenCalled();
  });

  test("transfers anonymous work on successful sign-in", async () => {
    mockSignIn.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue({
      messages: [{ role: "user", content: "hello" }],
      fileSystemData: { "/App.jsx": "code" },
    });
    mockCreateProject.mockResolvedValue({ id: "anon-project-id" });

    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signIn("user@test.com", "pass1234"));

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: "user", content: "hello" }],
        data: { "/App.jsx": "code" },
      })
    );
    expect(mockClearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
  });

  test("redirects to most recent project when no anon work exists", async () => {
    mockSignIn.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([
      { id: "proj-1" },
      { id: "proj-2" },
    ]);

    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signIn("user@test.com", "pass1234"));

    expect(mockPush).toHaveBeenCalledWith("/proj-1");
    expect(mockCreateProject).not.toHaveBeenCalled();
  });

  test("creates a new project when user has no existing projects", async () => {
    mockSignIn.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "fresh-project" });

    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signIn("user@test.com", "pass1234"));

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [],
        data: {},
      })
    );
    expect(mockPush).toHaveBeenCalledWith("/fresh-project");
  });

  test("skips anon work with empty messages array", async () => {
    mockSignIn.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue({
      messages: [],
      fileSystemData: {},
    });
    mockGetProjects.mockResolvedValue([{ id: "existing" }]);

    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signIn("user@test.com", "pass1234"));

    expect(mockClearAnonWork).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/existing");
  });
});

// --- signUp ---

describe("signUp", () => {
  test("calls signUpAction with email and password", async () => {
    mockSignUp.mockResolvedValue({ success: false, error: "exists" });

    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signUp("new@test.com", "password123"));

    expect(mockSignUp).toHaveBeenCalledWith("new@test.com", "password123");
  });

  test("returns the result from signUpAction", async () => {
    const authResult = { success: false, error: "Email already registered" };
    mockSignUp.mockResolvedValue(authResult);

    const { result } = renderHook(() => useAuth());
    const returned = await act(() =>
      result.current.signUp("new@test.com", "pass1234")
    );

    expect(returned).toEqual(authResult);
  });

  test("does not navigate when sign-up fails", async () => {
    mockSignUp.mockResolvedValue({ success: false, error: "exists" });

    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signUp("new@test.com", "pass1234"));

    expect(mockPush).not.toHaveBeenCalled();
  });

  test("transfers anonymous work on successful sign-up", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue({
      messages: [{ role: "user", content: "build me a form" }],
      fileSystemData: { "/App.jsx": "form code" },
    });
    mockCreateProject.mockResolvedValue({ id: "signup-proj" });

    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signUp("new@test.com", "pass1234"));

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: "user", content: "build me a form" }],
        data: { "/App.jsx": "form code" },
      })
    );
    expect(mockClearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/signup-proj");
  });

  test("redirects to most recent project when no anon work", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([{ id: "recent-proj" }]);

    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signUp("new@test.com", "pass1234"));

    expect(mockPush).toHaveBeenCalledWith("/recent-proj");
  });

  test("creates a new project when user has none", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    mockCreateProject.mockResolvedValue({ id: "brand-new" });

    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signUp("new@test.com", "pass1234"));

    expect(mockCreateProject).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/brand-new");
  });
});

// --- isLoading ---

describe("isLoading", () => {
  test("starts as false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  test("is true while signIn is in progress", async () => {
    let resolveSignIn!: (v: any) => void;
    mockSignIn.mockReturnValue(
      new Promise((r) => {
        resolveSignIn = r;
      })
    );

    const { result } = renderHook(() => useAuth());

    let signInPromise: Promise<any>;
    act(() => {
      signInPromise = result.current.signIn("u@t.com", "p");
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSignIn({ success: false });
      await signInPromise!;
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("resets to false when signIn action throws", async () => {
    mockSignIn.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useAuth());

    await expect(
      act(() => result.current.signIn("u@t.com", "p"))
    ).rejects.toThrow("network error");

    expect(result.current.isLoading).toBe(false);
  });

  test("resets to false when signUp action throws", async () => {
    mockSignUp.mockRejectedValue(new Error("server down"));

    const { result } = renderHook(() => useAuth());

    await expect(
      act(() => result.current.signUp("u@t.com", "p"))
    ).rejects.toThrow("server down");

    expect(result.current.isLoading).toBe(false);
  });

  test("resets to false when post-sign-in logic throws", async () => {
    mockSignIn.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue(null);
    mockGetProjects.mockRejectedValue(new Error("db error"));

    const { result } = renderHook(() => useAuth());

    await expect(
      act(() => result.current.signIn("u@t.com", "p"))
    ).rejects.toThrow("db error");

    expect(result.current.isLoading).toBe(false);
  });
});
