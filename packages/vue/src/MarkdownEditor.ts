import { defineComponent, ref, onMounted, onUnmounted, watch, h, computed } from "vue";
import { MarkdownEditor as CoreEditor } from "pd-editor-core";
import MarkdownIt from "markdown-it";
import type { EditorPlugin, ToolbarItem, Extension } from "pd-editor-core";
import type { PropType } from "vue";

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
  },
  emits: ["update:modelValue", "save"],
  setup(props, { emit }) {
    const editorContainerRef = ref<HTMLDivElement | null>(null);
    const editorRef = ref<CoreEditor | null>(null);
    const renderer = new MarkdownIt({ html: true, breaks: true, linkify: true });
    const previewHtml = ref("");

    const isControlled = computed(() => props.modelValue !== undefined);
    const computedHeight = computed(() =>
      typeof props.height === "number" ? `${props.height}px` : props.height
    );

    onMounted(() => {
      if (!editorContainerRef.value || props.preview === "preview") {
        if (props.preview === "preview") {
          const content = isControlled.value ? (props.modelValue ?? "") : props.defaultValue;
          previewHtml.value = renderer.render(content);
        }
        return;
      }

      const editor = new CoreEditor({
        parent: editorContainerRef.value,
        initialValue: isControlled.value ? (props.modelValue ?? "") : props.defaultValue,
        theme: props.theme,
        onChange: (v) => {
          emit("update:modelValue", v);
          if (props.preview === "split") {
            previewHtml.value = renderer.render(v);
          }
        },
        onSave: (v) => emit("save", v),
        placeholder: props.placeholder,
        readOnly: props.readOnly,
        extensions: props.extensions,
        plugins: props.plugins,
        toolbar: props.toolbar,
      });

      editorRef.value = editor;

      if (props.preview === "split") {
        const initVal = isControlled.value ? (props.modelValue ?? "") : props.defaultValue;
        previewHtml.value = renderer.render(initVal);
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
        previewHtml.value = renderer.render(newVal ?? "");
      }
    });

    onUnmounted(() => {
      editorRef.value?.destroy();
      editorRef.value = null;
    });

    return () => {
      const isDark = props.theme === "dark";
      const borderColor = isDark ? "#30363d" : "#d1d9e0";

      return h("div", {
        class: "pd-editor-vue",
        style: {
          display: "flex",
          height: computedHeight.value,
          borderRadius: "8px",
          overflow: "hidden",
          border: `1px solid ${borderColor}`,
          backgroundColor: isDark ? "#0d1117" : "#ffffff",
        },
      }, [
        // Editor pane
        props.preview !== "preview" ? h("div", {
          ref: editorContainerRef,
          style: { flex: 1, minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column" },
        }) : null,
        // Preview pane
        (props.preview === "split" || props.preview === "preview") ? h("div", {
          class: `pd-md-preview pd-md-theme-${props.theme}`,
          style: {
            flex: 1,
            minWidth: 0,
            overflow: "auto",
            padding: "24px",
            borderLeft: props.preview === "split" ? `1px solid ${borderColor}` : "none",
          },
          innerHTML: previewHtml.value,
        }) : null,
      ]);
    };
  },
});
