import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";

/**
 * markdown-it plugin: task list support
 * Converts `- [ ] text` and `- [x] text` into checkbox list items
 */
export function taskListPlugin(md: MarkdownIt): void {
  md.core.ruler.after("inline", "task-list", (state) => {
    const tokens = state.tokens;

    for (let i = 2; i < tokens.length; i++) {
      if (!isTaskListItem(tokens, i)) continue;

      const token = tokens[i];
      const content = token.content;

      // Check if starts with [ ] or [x]
      const checked = content.startsWith("[x] ") || content.startsWith("[X] ");
      const unchecked = content.startsWith("[ ] ");

      if (!checked && !unchecked) continue;

      // Update token content — remove the checkbox prefix
      token.content = content.slice(4);
      token.children = token.children?.slice(3) ?? [];

      // Add checkbox at the beginning
      const checkbox = new (state.Token as any)("html_inline", "", 0);
      checkbox.content = checked
        ? '<input type="checkbox" checked disabled class="pd-md-task-checkbox" /> '
        : '<input type="checkbox" disabled class="pd-md-task-checkbox" /> ';

      token.children.unshift(checkbox);

      // Mark the parent list item
      tokens[i - 2].attrJoin("class", "pd-md-task-item");
    }
  });
}

function isTaskListItem(tokens: Token[], index: number): boolean {
  return (
    tokens[index].type === "inline" &&
    tokens[index - 1].type === "paragraph_open" &&
    tokens[index - 2].type === "list_item_open"
  );
}
