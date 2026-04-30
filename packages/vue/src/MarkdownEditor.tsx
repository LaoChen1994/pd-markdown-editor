import { defineComponent, ref, onMounted, onUnmounted, watch, computed } from "vue";
import { MarkdownEditor as CoreEditor } from "pd-editor-core";
import { createParser } from "pd-markdown/parser";
import { components as mdUiComponents } from "pd-markdown-ui/vue";
import type { EditorPlugin, ToolbarItem, Extension } from "pd-editor-core";
import type { Component, PropType, VNode, VNodeChild } from "vue";

/** Simplified AST node shape (compatible with mdast Root/Content) */
interface AstNode {
  type: string;
  children?: AstNode[];
  value?: string;
  depth?: number;
  ordered?: boolean;
  start?: number | null;
  checked?: boolean | null;
  url?: string;
  alt?: string;
  title?: string;
  lang?: string;
  data?: {
    id?: unknown;
    isHeader?: boolean;
    align?: "left" | "center" | "right" | null;
  };
}

type JsxRenderable = (props: Record<string, unknown> & { children?: VNodeChild | (() => VNodeChild) }) => VNode;

const renderVNode = (
  component: Component | string,
  props: Record<string, unknown>,
  children?: VNodeChild
): VNode => {
  const Node = component as unknown as JsxRenderable;
  if (typeof component === "string") {
    return <Node {...props}>{children}</Node> as VNode;
  }
  return <Node {...props}>{() => children}</Node> as VNode;
};

/**
 * Recursively render an mdast AST node to Vue VNodes
 * using pd-markdown-ui/vue components
 */
export function renderAstNode(
  node: AstNode,
  componentMap: Record<string, unknown>,
  key: string | number,
  isTableHeader = false
): VNode | VNode[] | string | null {
  if (node.type === "root") {
    return (node.children ?? []).map((child, i) =>
      renderAstNode(child, componentMap, i)
    ).filter(Boolean) as VNode[];
  }

  if (node.type === "text") {
    return node.value ?? "";
  }

  // Map mdast node types to component keys
  const typeMap: Record<string, string> = {
    heading: "h",
    paragraph: "p",
    blockquote: "blockquote",
    list: "list",
    listItem: "li",
    code: "pre",
    inlineCode: "code",
    thematicBreak: "hr",
    link: "a",
    image: "img",
    emphasis: "em",
    strong: "strong",
    delete: "del",
    html: "div",
  };

  // Resolve heading level (h1-h6)
  if (node.type === "heading" && node.depth) {
    const tag = `h${node.depth}`;
    const comp = componentMap[tag] as Component | undefined;
    const id = typeof node.data?.id === "string" ? node.data.id : undefined;
    const children = (node.children ?? []).map((child, i) =>
      renderAstNode(child, componentMap, i)
    ).filter(Boolean);

    if (comp) {
      return renderVNode(comp, { key, id }, children as VNode[]);
    }
    return renderVNode(tag, { key, id }, children as VNode[]);
  }

  // List (ul/ol)
  if (node.type === "list") {
    const tag = node.ordered ? "ol" : "ul";
    const comp = componentMap[tag] as Component | undefined;
    const start = node.ordered && node.start != null && node.start !== 1 ? node.start : undefined;
    const children = (node.children ?? []).map((child, i) =>
      renderAstNode(child, componentMap, i)
    ).filter(Boolean);

    if (comp) {
      return renderVNode(comp, { key, start }, children as VNode[]);
    }
    return renderVNode(tag, { key, start }, children as VNode[]);
  }

  if (node.type === "listItem") {
    const comp = componentMap["li"] as Component | undefined;
    const children = (node.children ?? []).map((child, i) =>
      renderAstNode(child, componentMap, i)
    ).filter(Boolean);

    if (typeof node.checked === "boolean") {
      const taskChildren = [
        <input key="checkbox" type="checkbox" checked={node.checked} readonly />,
        renderVNode("span", { key: "content" }, children as VNode[]),
      ];
      return comp
        ? renderVNode(comp, { key, class: "task-list-item" }, taskChildren)
        : renderVNode("li", { key, class: "task-list-item" }, taskChildren);
    }

    if (comp) {
      return renderVNode(comp, { key }, children as VNode[]);
    }
    return renderVNode("li", { key }, children as VNode[]);
  }

  if (node.type === "table") {
    const tableComp = componentMap["table"] as Component | undefined;
    const theadComp = componentMap["thead"] as Component | undefined;
    const tbodyComp = componentMap["tbody"] as Component | undefined;
    const [headerRow, ...bodyRows] = node.children ?? [];
    const tableChildren: VNode[] = [];

    if (headerRow) {
      const renderedHeader = renderAstNode(headerRow, componentMap, "head", true);
      if (renderedHeader && typeof renderedHeader !== "string" && !Array.isArray(renderedHeader)) {
        tableChildren.push(theadComp ? renderVNode(theadComp, { key: "thead" }, [renderedHeader]) : renderVNode("thead", { key: "thead" }, [renderedHeader]));
      }
    }

    if (bodyRows.length > 0) {
      const renderedRows = bodyRows.map((row, i) =>
        renderAstNode(row, componentMap, i, false)
      ).filter((row): row is VNode => !!row && typeof row !== "string" && !Array.isArray(row));
      tableChildren.push(tbodyComp ? renderVNode(tbodyComp, { key: "tbody" }, renderedRows) : renderVNode("tbody", { key: "tbody" }, renderedRows));
    }

    if (tableComp) {
      return renderVNode(tableComp, { key }, tableChildren);
    }
    return renderVNode("table", { key }, tableChildren);
  }

  if (node.type === "tableRow") {
    const comp = componentMap["tr"] as Component | undefined;
    const children = (node.children ?? []).map((child, i) =>
      renderAstNode(child, componentMap, i, isTableHeader)
    ).filter(Boolean);

    if (comp) {
      return renderVNode(comp, { key }, children as VNode[]);
    }
    return renderVNode("tr", { key }, children as VNode[]);
  }

  if (node.type === "tableCell") {
    const header = isTableHeader || node.data?.isHeader === true;
    const tag = header ? "th" : "td";
    const comp = componentMap[tag] as Component | undefined;
    const align = node.data?.align ?? undefined;
    const children = (node.children ?? []).map((child, i) =>
      renderAstNode(child, componentMap, i)
    ).filter(Boolean);

    if (comp) {
      return renderVNode(comp, { key, align }, children as VNode[]);
    }
    return renderVNode(tag, { key, align }, children as VNode[]);
  }

  // Code block
  if (node.type === "code") {
    const preComp = componentMap["pre"] as Component | undefined;
    const codeComp = componentMap["code"] as Component | undefined;

    const codeEl = codeComp
      ? renderVNode(codeComp, { class: node.lang ? `language-${node.lang}` : "" }, node.value ?? "")
      : renderVNode("code", { class: node.lang ? `language-${node.lang}` : "" }, node.value ?? "");

    if (preComp) {
      return renderVNode(preComp, { key }, [codeEl]);
    }
    return renderVNode("pre", { key }, [codeEl]);
  }

  // Inline code
  if (node.type === "inlineCode") {
    const comp = componentMap["code"] as Component | undefined;
    if (comp) {
      return renderVNode(comp, { key }, node.value ?? "");
    }
    return renderVNode("code", { key }, node.value ?? "");
  }

  // Link
  if (node.type === "link") {
    const children = (node.children ?? []).map((child, i) =>
      renderAstNode(child, componentMap, i)
    ).filter(Boolean);
    return renderVNode("a", { key, href: node.url, title: node.title ?? undefined }, children as VNode[]);
  }

  // Image
  if (node.type === "image") {
    return <img key={key} src={node.url} alt={node.alt ?? ""} title={node.title ?? undefined} />;
  }

  // HTML
  if (node.type === "html") {
    return <div key={key} innerHTML={node.value ?? ""} />;
  }

  // Thematic break
  if (node.type === "thematicBreak") {
    return <hr key={key} />;
  }

  // Generic parent nodes with children
  if (node.children) {
    const tag = typeMap[node.type] ?? "div";
    const comp = componentMap[tag] as Component | undefined;
    const children = node.children.map((child, i) =>
      renderAstNode(child, componentMap, i)
    ).filter(Boolean);

    if (comp) {
      return renderVNode(comp, { key }, children as VNode[]);
    }
    return renderVNode(tag, { key }, children as VNode[]);
  }

  return null;
}

export const MarkdownEditor = defineComponent({
  name: "MarkdownEditor",
  props: {
    modelValue: { type: String, default: undefined },
    defaultValue: { type: String, default: "" },
    theme: { type: String as PropType<"light" | "dark">, default: "light" },
    placeholder: { type: String, default: undefined },
    readOnly: { type: Boolean, default: false },
    height: { type: [String, Number], default: "500px" },
    preview: { type: String as PropType<"edit" | "preview" | "split">, default: "edit" },
    toolbar: { type: [Boolean, Array] as PropType<boolean | ToolbarItem[]>, default: true },
    plugins: { type: Array as PropType<EditorPlugin[]>, default: () => [] },
    extensions: { type: Array as PropType<Extension[]>, default: () => [] },
    /** Custom component overrides for Markdown rendering */
    renderComponentMap: { type: Object as PropType<Record<string, unknown>>, default: undefined },
  },
  emits: ["update:modelValue", "save"],
  setup(props, { emit }) {
    const editorContainerRef = ref<HTMLDivElement | null>(null);
    const editorRef = ref<CoreEditor | null>(null);
    const previewAst = ref<AstNode | null>(null);

    const parser = createParser();

    const isControlled = computed(() => props.modelValue !== undefined);
    const computedHeight = computed(() =>
      typeof props.height === "number" ? `${props.height}px` : props.height
    );

    // Merge pd-markdown-ui/vue components with user overrides
    const mergedComponents = computed(() => ({
      ...mdUiComponents,
      ...(props.renderComponentMap ?? {}),
    }));

    function updatePreview(markdown: string) {
      try {
        previewAst.value = parser.parse(markdown) as unknown as AstNode;
      } catch {
        previewAst.value = null;
      }
    }

    onMounted(() => {
      if (!editorContainerRef.value || props.preview === "preview") {
        if (props.preview === "preview") {
          const content = isControlled.value ? (props.modelValue ?? "") : props.defaultValue;
          updatePreview(content);
        }
        return;
      }

      const editor = new CoreEditor({
        parent: editorContainerRef.value,
        initialValue: isControlled.value ? (props.modelValue ?? "") : props.defaultValue,
        theme: props.theme,
        onChange: (v: string) => {
          emit("update:modelValue", v);
          if (props.preview === "split") {
            updatePreview(v);
          }
        },
        onSave: (v: string) => emit("save", v),
        placeholder: props.placeholder,
        readOnly: props.readOnly,
        extensions: props.extensions,
        plugins: props.plugins,
        toolbar: props.toolbar,
      });

      editorRef.value = editor;

      if (props.preview === "split") {
        const initVal = isControlled.value ? (props.modelValue ?? "") : props.defaultValue;
        updatePreview(initVal);
      }
    });

    // Sync controlled value
    watch(() => props.modelValue, (newVal) => {
      if (isControlled.value && editorRef.value) {
        const current = editorRef.value.getValue();
        if (current !== newVal) {
          editorRef.value.setValue(newVal ?? "");
        }
      }
      if (props.preview === "preview") {
        updatePreview(newVal ?? "");
      }
    });

    onUnmounted(() => {
      editorRef.value?.destroy();
      editorRef.value = null;
    });

    return () => {
      const isDark = props.theme === "dark";
      const borderColor = isDark ? "#30363d" : "#d1d9e0";
      const Div = "div" as unknown as JsxRenderable;

      // Render the AST preview using pd-markdown-ui/vue components
      const previewChildren: VNode[] = [];
      if (previewAst.value) {
        const rendered = renderAstNode(previewAst.value, mergedComponents.value, "root");
        if (Array.isArray(rendered)) {
          previewChildren.push(...rendered);
        } else if (rendered && typeof rendered !== "string") {
          previewChildren.push(rendered);
        }
      }

      return (
        <Div
          class="pd-editor-vue"
          style={{
            display: "flex",
            height: computedHeight.value,
            borderRadius: "8px",
            overflow: "hidden",
            border: `1px solid ${borderColor}`,
            backgroundColor: isDark ? "#0d1117" : "#ffffff",
          }}
        >
          {props.preview !== "preview" ? (
            <Div
              ref={editorContainerRef}
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            />
          ) : null}
          {props.preview === "split" || props.preview === "preview" ? (
            <Div
              class={`pd-md-preview pd-md-theme-${props.theme}`}
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "auto",
                padding: "24px",
                borderLeft: props.preview === "split" ? `1px solid ${borderColor}` : "none",
              }}
            >
              {previewChildren}
            </Div>
          ) : null}
        </Div>
      );
    };
  },
});
