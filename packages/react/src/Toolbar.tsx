import React from "react";
import type { EditorCommand, ToolbarItem } from "pd-editor-core";
import { getDefaultToolbarItems } from "pd-editor-core";

export interface ToolbarProps {
  /** Custom toolbar items, defaults to standard set */
  items?: ToolbarItem[];
  /** Command handler */
  onCommand: (command: EditorCommand | string) => void;
  /** Theme for styling */
  theme?: "light" | "dark";
}

/**
 * Standalone React toolbar component.
 * Use with useMarkdownEditor hook for custom layouts.
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  items,
  onCommand,
  theme = "light",
}) => {
  const toolbarItems = items ?? getDefaultToolbarItems();
  const isDark = theme === "dark";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2px",
        padding: "6px 8px",
        borderBottom: `1px solid ${isDark ? "#30363d" : "#d1d9e0"}`,
        backgroundColor: isDark ? "#161b22" : "#f6f8fa",
        flexWrap: "wrap",
      }}
    >
      {toolbarItems.map((item, i) => {
        if (item.divider) {
          return (
            <div
              key={`divider-${i}`}
              style={{
                width: "1px",
                height: "20px",
                backgroundColor: isDark ? "#30363d" : "#d1d9e0",
                margin: "0 4px",
              }}
            />
          );
        }

        return (
          <button
            key={item.command}
            type="button"
            title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
            onClick={(e) => { e.preventDefault(); onCommand(item.command); }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              border: "none",
              borderRadius: "4px",
              backgroundColor: "transparent",
              color: isDark ? "#8b949e" : "#636c76",
              cursor: "pointer",
              padding: "0",
              transition: "all 0.15s ease",
            }}
            dangerouslySetInnerHTML={{ __html: item.icon }}
          />
        );
      })}
    </div>
  );
};
