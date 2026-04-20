import { defineComponent, h } from "vue";
import { getDefaultToolbarItems } from "pd-editor-core";
import type { ToolbarItem } from "pd-editor-core";
import type { PropType } from "vue";

export const Toolbar = defineComponent({
  name: "EditorToolbar",
  props: {
    items: { type: Array as PropType<ToolbarItem[]>, default: undefined },
    theme: { type: String as PropType<"light" | "dark">, default: "light" },
  },
  emits: ["command"],
  setup(props, { emit }) {
    return () => {
      const toolbarItems = props.items ?? getDefaultToolbarItems();
      const isDark = props.theme === "dark";

      return h("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: "2px",
          padding: "6px 8px",
          borderBottom: `1px solid ${isDark ? "#30363d" : "#d1d9e0"}`,
          backgroundColor: isDark ? "#161b22" : "#f6f8fa",
          flexWrap: "wrap",
        },
      }, toolbarItems.map((item, i) => {
        if (item.divider) {
          return h("div", {
            key: `divider-${i}`,
            style: { width: "1px", height: "20px", backgroundColor: isDark ? "#30363d" : "#d1d9e0", margin: "0 4px" },
          });
        }
        return h("button", {
          key: item.command,
          type: "button",
          title: item.shortcut ? `${item.label} (${item.shortcut})` : item.label,
          innerHTML: item.icon,
          onClick: (e: Event) => { e.preventDefault(); emit("command", item.command); },
          style: {
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "28px", height: "28px", border: "none", borderRadius: "4px",
            backgroundColor: "transparent", color: isDark ? "#8b949e" : "#636c76",
            cursor: "pointer", padding: "0",
          },
        });
      }));
    };
  },
});
