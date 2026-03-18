import { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

function getFileName(path: string): string {
  return path.split("/").pop() || path;
}

const LABELS: Record<string, Record<string, [string, string]>> = {
  str_replace_editor: {
    create: ["Creating", "Created"],
    str_replace: ["Editing", "Edited"],
    insert: ["Editing", "Edited"],
    view: ["Viewing", "Viewed"],
    undo_edit: ["Reverting", "Reverted"],
  },
  file_manager: {
    rename: ["Renaming", "Renamed"],
    delete: ["Deleting", "Deleted"],
  },
};

function getLabel(toolInvocation: ToolInvocation): { text: string; title?: string } {
  const { toolName, args } = toolInvocation;
  const isDone = toolInvocation.state === "result";
  const command = args?.command as string | undefined;
  const path = args?.path as string | undefined;

  const toolLabels = LABELS[toolName];
  if (!toolLabels || !command || !toolLabels[command]) {
    return { text: toolName };
  }

  const [inProgress, done] = toolLabels[command];
  const verb = isDone ? done : inProgress;

  if (!path) {
    return { text: verb };
  }

  return { text: `${verb} ${getFileName(path)}`, title: path };
}

interface ToolCallLabelProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallLabel({ toolInvocation }: ToolCallLabelProps) {
  const isDone = toolInvocation.state === "result" && toolInvocation.result;
  const { text, title } = getLabel(toolInvocation);

  return (
    <div
      className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200"
      title={title}
    >
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{text}</span>
    </div>
  );
}
