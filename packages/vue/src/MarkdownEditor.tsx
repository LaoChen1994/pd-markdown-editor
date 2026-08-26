import { defineComponent, ref, onMounted, onUnmounted, watch, computed, nextTick, h } from "vue";
import { MarkdownEditor as CoreEditor } from "pd-editor-core";
import { createParser } from "pd-markdown/parser";
import katex from "katex";
import type { EditorPlugin, ToolbarItem, Extension, MarkdownCodeLanguages } from "pd-editor-core";
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

const styledTag = (tag: string, baseClass: string) => defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(tag, { ...attrs, class: `${baseClass} ${attrs.class ?? ""}` }, slots.default?.());
  },
});

export const markdownUiComponents = {
  h1: styledTag("h1", "pd-scroll-m-20 pd-text-4xl pd-font-extrabold pd-tracking-tight lg:pd-text-5xl pd-mb-6"),
  h2: styledTag("h2", "pd-scroll-m-20 pd-border-b pd-pb-2 pd-text-3xl pd-font-semibold pd-tracking-tight pd-first:mt-0 pd-mt-10 pd-mb-4"),
  h3: styledTag("h3", "pd-scroll-m-20 pd-text-2xl pd-font-semibold pd-tracking-tight pd-mt-8 pd-mb-4"),
  h4: styledTag("h4", "pd-scroll-m-20 pd-text-xl pd-font-semibold pd-tracking-tight pd-mt-6 pd-mb-2"),
  h5: styledTag("h5", "pd-scroll-m-20 pd-text-lg pd-font-semibold pd-tracking-tight pd-mt-4 pd-mb-2"),
  h6: styledTag("h6", "pd-scroll-m-20 pd-text-base pd-font-semibold pd-tracking-tight pd-mt-4 pd-mb-2"),
  p: styledTag("p", "pd-leading-7 [&:not(:first-child)]:pd-mt-6 pd-mb-4"),
  blockquote: styledTag("blockquote", "pd-mt-6 pd-border-l-2 pd-pl-6 pd-italic"),
  ul: styledTag("ul", "pd-my-6 pd-ml-6 pd-list-disc [&>li]:pd-mt-2"),
  ol: styledTag("ol", "pd-my-6 pd-ml-6 pd-list-decimal [&>li]:pd-mt-2"),
  li: styledTag("li", "pd-leading-7"),
  table: styledTag("table", "pd-my-6 pd-w-full pd-overflow-hidden pd-rounded-md"),
  thead: styledTag("thead", "pd-bg-muted"),
  tbody: styledTag("tbody", "pd-divide-y pd-divide-border"),
  tfoot: styledTag("tfoot", "pd-bg-muted pd-font-medium"),
  tr: styledTag("tr", "pd-m-0 pd-border-t pd-p-0 even:pd-bg-muted/50"),
  th: styledTag("th", "pd-border pd-px-4 pd-py-2 pd-text-left pd-font-bold [&[align=center]]:pd-text-center [&[align=right]]:pd-text-right"),
  td: styledTag("td", "pd-border pd-px-4 pd-py-2 pd-text-left [&[align=center]]:pd-text-center [&[align=right]]:pd-text-right"),
  pre: styledTag("pre", "pd-pre-wrapper"),
  code: styledTag("code", "pd-relative pd-rounded pd-bg-muted pd-px-[0.3rem] pd-py-[0.2rem] pd-font-mono pd-text-sm pd-font-semibold"),
};

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

const renderMath = (value: string, displayMode: boolean): string => {
  try {
    return katex.renderToString(value, {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  } catch {
    return value;
  }
};

let mermaidPromise: Promise<any> | null = null;
const loadMermaid = () => {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      m.default.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "strict",
      });
      return m.default;
    });
  }
  return mermaidPromise;
};

export const MermaidRenderer = defineComponent({
  name: "MermaidRenderer",
  props: {
    value: { type: String, required: true },
    theme: { type: String, default: "light" },
  },
  setup(props) {
    const svgContent = ref("");
    const error = ref<string | null>(null);

    const renderDiagram = async () => {
      try {
        const m = await loadMermaid();
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const isDark = props.theme === "dark";
        m.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "base",
          securityLevel: "strict",
          fontFamily: "Inter, system-ui, sans-serif",
          themeVariables: isDark ? {
            background: "#0d1117",
            primaryColor: "#21262d",
            primaryTextColor: "#c9d1d9",
            primaryBorderColor: "#30363d",
            lineColor: "#8b949e",
            secondaryColor: "#161b22",
            tertiaryColor: "#0d1117",
            nodeBorder: "#30363d",
            mainBkg: "#21262d",
            textColor: "#c9d1d9",
          } : {
            background: "#ffffff",
            primaryColor: "#f6f8fa",
            primaryTextColor: "#24292f",
            primaryBorderColor: "#d0d7de",
            lineColor: "#57606a",
            secondaryColor: "#f6f8fa",
            tertiaryColor: "#ffffff",
            nodeBorder: "#d0d7de",
            mainBkg: "#f6f8fa",
            textColor: "#24292f",
          },
          flowchart: {
            htmlLabels: true,
            useWidth: true,
            curve: "basis",
          },
        });
        const { svg } = await m.render(id, props.value);
        svgContent.value = svg;
        error.value = null;
      } catch (err: any) {
        error.value = err.message || "Failed to render Mermaid diagram";
      }
    };

    onMounted(() => renderDiagram());
    watch(() => [props.value, props.theme], () => renderDiagram());

    return () => {
      if (error.value) {
        return renderVNode(
          "div",
          {
            class: "mermaid-error",
            style: {
              color: "#f85149",
              padding: "12px",
              border: "1px solid #f85149",
              borderRadius: "6px",
              margin: "12px 0",
              background: "rgba(248, 81, 73, 0.1)",
            },
          },
          [
            renderVNode("p", { style: { margin: "0 0 6px 0" } }, [
              renderVNode("strong", {}, "Mermaid rendering error:"),
            ]),
            renderVNode("pre", { style: { whiteSpace: "pre-wrap", margin: "0" } }, error.value),
          ]
        );
      }

      if (!svgContent.value) {
        return renderVNode(
          "div",
          {
            class: "mermaid-loading",
            style: { padding: "12px", fontStyle: "italic", opacity: 0.7 },
          },
          "Rendering diagram..."
        );
      }

      return renderVNode(
        "div",
        {
          class: "pd-rendered-mermaid",
          style: { display: "flex", justifyContent: "center", margin: "16px 0" },
          innerHTML: svgContent.value,
        }
      );
    };
  },
});


const renderTextWithMath = (value: string, keyPrefix: string): VNodeChild[] => {
  const blockMatch = value.match(/^\s*\$\$([\s\S]+?)\$\$\s*$/);
  if (blockMatch) {
    return [
      <span
        key={`${keyPrefix}-block`}
        innerHTML={renderMath(blockMatch[1].trim(), true)}
      />,
    ];
  }

  const parts: VNodeChild[] = [];
  const mathPattern = /\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let index = 0;
  let match: RegExpExecArray | null;

  while ((match = mathPattern.exec(value)) !== null) {
    if (match.index > lastIndex) {
      parts.push(value.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={`${keyPrefix}-inline-${index}`}
        innerHTML={renderMath(match[1].trim(), false)}
      />
    );
    lastIndex = match.index + match[0].length;
    index += 1;
  }

  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [value];
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

  if (node.type === "paragraph") {
    const comp = componentMap["p"] as Component | undefined;
    const children = (node.children ?? []).flatMap((child, i) => {
      if (child.type === "text") {
        return renderTextWithMath(child.value ?? "", `${key}-${i}`);
      }
      const rendered = renderAstNode(child, componentMap, i);
      return Array.isArray(rendered) ? rendered : [rendered];
    }).filter(Boolean) as VNodeChild[];

    if (comp) {
      return renderVNode(comp, { key }, children);
    }
    return renderVNode("p", { key }, children);
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
    if (node.lang?.toLowerCase() === "mermaid") {
      const theme = componentMap["_theme"] as string || "light";
      return renderVNode(MermaidRenderer, { key, value: node.value ?? "", theme });
    }

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
    return null;
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
    codeLanguages: { type: [Array, Function] as PropType<MarkdownCodeLanguages>, default: undefined },
    /** Custom component overrides for Markdown rendering */
    renderComponentMap: { type: Object as PropType<Record<string, unknown>>, default: undefined },
  },
  emits: ["update:modelValue", "save"],
  setup(props, { emit }) {
    const editorContainerRef = ref<HTMLDivElement | null>(null);
    const previewRef = ref<HTMLDivElement | null>(null);
    const editorRef = ref<CoreEditor | null>(null);
    const previewAst = ref<AstNode | null>(null);
    const latestValue = ref(props.modelValue ?? props.defaultValue);
    const syncingScroll = ref(false);
    let cleanupScrollSync: (() => void) | null = null;

    const parser = createParser();

    const isControlled = computed(() => props.modelValue !== undefined);
    const computedHeight = computed(() =>
      typeof props.height === "number" ? `${props.height}px` : props.height
    );

    // Merge pd-markdown-ui/vue components with user overrides
    const mergedComponents = computed(() => ({
      ...markdownUiComponents,
      ...(props.renderComponentMap ?? {}),
    }));

    function updatePreview(markdown: string) {
      try {
        previewAst.value = parser.parse(markdown) as unknown as AstNode;
      } catch {
        previewAst.value = null;
      }
    }

    const mountEditor = () => {
      if (editorRef.value) return;
      if (!editorContainerRef.value || props.preview === "preview") {
        if (props.preview === "preview") {
          const content = isControlled.value ? (props.modelValue ?? "") : latestValue.value;
          updatePreview(content);
        }
        return;
      }

      const editor = new CoreEditor({
        parent: editorContainerRef.value,
        initialValue: isControlled.value ? (props.modelValue ?? "") : latestValue.value,
        theme: props.theme,
        onChange: (v: string) => {
          latestValue.value = v;
          emit("update:modelValue", v);
          if (props.preview === "split") {
            updatePreview(v);
          }
        },
        onSave: (v: string) => emit("save", v),
        placeholder: props.placeholder,
        readOnly: props.readOnly,
        extensions: props.extensions,
        codeLanguages: props.codeLanguages,
        plugins: props.plugins,
        toolbar: props.toolbar,
      });

      editorRef.value = editor;

      if (props.preview === "split") {
        const initVal = isControlled.value ? (props.modelValue ?? "") : latestValue.value;
        updatePreview(initVal);
      }
    };

    const mountScrollSync = () => {
      cleanupScrollSync?.();
      cleanupScrollSync = null;
      if (props.preview !== "split") return;
      const editorScroller = editorContainerRef.value?.querySelector<HTMLElement>(".cm-scroller");
      const previewPane = previewRef.value;
      if (!editorScroller || !previewPane) return;

      const syncPreview = () => {
        if (syncingScroll.value) return;
        syncingScroll.value = true;
        const editorMax = editorScroller.scrollHeight - editorScroller.clientHeight;
        const previewMax = previewPane.scrollHeight - previewPane.clientHeight;
        previewPane.scrollTop = editorMax > 0 && previewMax > 0 ? (editorScroller.scrollTop / editorMax) * previewMax : 0;
        syncingScroll.value = false;
      };
      const syncEditor = () => {
        if (syncingScroll.value) return;
        syncingScroll.value = true;
        const previewMax = previewPane.scrollHeight - previewPane.clientHeight;
        const editorMax = editorScroller.scrollHeight - editorScroller.clientHeight;
        editorScroller.scrollTop = previewMax > 0 && editorMax > 0 ? (previewPane.scrollTop / previewMax) * editorMax : 0;
        syncingScroll.value = false;
      };

      editorScroller.addEventListener("scroll", syncPreview);
      previewPane.addEventListener("scroll", syncEditor);
      cleanupScrollSync = () => {
        editorScroller.removeEventListener("scroll", syncPreview);
        previewPane.removeEventListener("scroll", syncEditor);
      };
    };

    onMounted(async () => {
      mountEditor();
      await nextTick();
      mountScrollSync();
    });

    // Sync controlled value
    watch(() => props.modelValue, (newVal) => {
      if (isControlled.value && editorRef.value) {
        const current = editorRef.value.getValue();
        if (current !== newVal) {
          editorRef.value.setValue(newVal ?? "", { emitChange: false });
        }
        latestValue.value = newVal ?? "";
      }
      if (props.preview === "split") {
        updatePreview(newVal ?? "");
      }
      if (props.preview === "preview") {
        updatePreview(newVal ?? "");
      }
    });

    watch(() => props.theme, (theme) => {
      editorRef.value?.setTheme(theme);
    });

    watch(() => props.readOnly, (readOnly) => {
      editorRef.value?.setReadOnly(readOnly);
    });

    watch(() => props.preview, async (preview) => {
      if (preview === "preview") {
        updatePreview(isControlled.value ? (props.modelValue ?? "") : latestValue.value);
        return;
      }
      await nextTick();
      mountEditor();
      mountScrollSync();
      if (preview === "split") {
        updatePreview(isControlled.value ? (props.modelValue ?? "") : latestValue.value);
      }
    });

    onUnmounted(() => {
      cleanupScrollSync?.();
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
        const componentMapWithTheme = {
          ...mergedComponents.value,
          _theme: props.theme,
        };
        const rendered = renderAstNode(previewAst.value, componentMapWithTheme, "root");
        if (Array.isArray(rendered)) {
          previewChildren.push(...rendered);
        } else if (rendered && typeof rendered !== "string") {
          previewChildren.push(rendered);
        }
      }

      return (
        <Div
          class="pd-editor-vue"
          data-preview={props.preview}
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
              ref={previewRef}
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
