import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";

export function createLightTheme(): Extension {
  return EditorView.theme({
    "&": { backgroundColor: "#ffffff", color: "#1f2328" },
    ".cm-content": { caretColor: "#0969da", fontFamily: "'SF Mono', Menlo, Consolas, monospace", fontSize: "14px", lineHeight: "1.6" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#0969da" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": { backgroundColor: "#dbe9f9" },
    ".cm-gutters": { backgroundColor: "#f6f8fa", color: "#636c76", border: "none", borderRight: "1px solid #d1d9e0" },
    ".cm-activeLineGutter": { backgroundColor: "#ebeef1" },
    ".cm-activeLine": { backgroundColor: "#f6f8fa" },
  }, { dark: false });
}

export function createDarkTheme(): Extension {
  return EditorView.theme({
    "&": { backgroundColor: "#0d1117", color: "#e6edf3" },
    ".cm-content": { caretColor: "#58a6ff", fontFamily: "'SF Mono', Menlo, Consolas, monospace", fontSize: "14px", lineHeight: "1.6" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#58a6ff" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": { backgroundColor: "#1a3a5c" },
    ".cm-gutters": { backgroundColor: "#010409", color: "#484f58", border: "none", borderRight: "1px solid #21262d" },
    ".cm-activeLineGutter": { backgroundColor: "#161b22" },
    ".cm-activeLine": { backgroundColor: "#161b22" },
  }, { dark: true });
}
