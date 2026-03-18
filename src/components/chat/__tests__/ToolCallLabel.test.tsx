import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallLabel } from "../ToolCallLabel";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

test("shows 'Created' with filename for str_replace_editor create in result state", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/components/Card.jsx" },
    state: "result",
    result: "Success",
  };

  render(<ToolCallLabel toolInvocation={toolInvocation} />);
  expect(screen.getByText("Created Card.jsx")).toBeDefined();
});

test("shows 'Creating' with filename for str_replace_editor create in call state", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "call",
  };

  render(<ToolCallLabel toolInvocation={toolInvocation} />);
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows 'Edited' for str_replace_editor str_replace in result state", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "/App.jsx" },
    state: "result",
    result: "Success",
  };

  render(<ToolCallLabel toolInvocation={toolInvocation} />);
  expect(screen.getByText("Edited App.jsx")).toBeDefined();
});

test("shows 'Edited' for str_replace_editor insert in result state", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "insert", path: "/utils/helpers.jsx" },
    state: "result",
    result: "Success",
  };

  render(<ToolCallLabel toolInvocation={toolInvocation} />);
  expect(screen.getByText("Edited helpers.jsx")).toBeDefined();
});

test("shows 'Deleted' for file_manager delete in result state", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "file_manager",
    args: { command: "delete", path: "/old-file.jsx" },
    state: "result",
    result: { success: true },
  };

  render(<ToolCallLabel toolInvocation={toolInvocation} />);
  expect(screen.getByText("Deleted old-file.jsx")).toBeDefined();
});

test("shows 'Renamed' for file_manager rename in result state", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "file_manager",
    args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
    state: "result",
    result: { success: true },
  };

  render(<ToolCallLabel toolInvocation={toolInvocation} />);
  expect(screen.getByText("Renamed old.jsx")).toBeDefined();
});

test("falls back to raw tool name for unknown tools", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "unknown_tool",
    args: {},
    state: "result",
    result: "done",
  };

  render(<ToolCallLabel toolInvocation={toolInvocation} />);
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("shows full path in title attribute", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/components/ui/Card.jsx" },
    state: "result",
    result: "Success",
  };

  const { container } = render(<ToolCallLabel toolInvocation={toolInvocation} />);
  const pill = container.firstElementChild as HTMLElement;
  expect(pill.getAttribute("title")).toBe("/components/ui/Card.jsx");
});
