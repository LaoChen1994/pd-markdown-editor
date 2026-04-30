import { defineComponent } from "vue";
import { getDefaultToolbarItems } from "pd-editor-core";
import type { ToolbarItem } from "pd-editor-core";
import type { PropType, VNode, VNodeChild } from "vue";

type JsxRenderable = (props: Record<string, unknown> & { children?: VNodeChild }) => VNode;

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
      const Div = "div" as unknown as JsxRenderable;
      const Button = "button" as unknown as JsxRenderable;

      return (
        <Div
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
                <Div
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
              <Button
                key={item.command}
                type="button"
                title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
                innerHTML={item.icon}
                onClick={(event: Event) => {
                  event.preventDefault();
                  emit("command", item.command);
                }}
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
                }}
              />
            );
          })}
        </Div>
      );
    };
  },
});
