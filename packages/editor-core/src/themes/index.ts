import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";

export function createLightTheme(): Extension {
  const selectionColor = "#b7d7f8";

  return EditorView.theme({
    "&": { backgroundColor: "#ffffff", color: "#1f2328" },
    ".cm-content": { caretColor: "#0969da", fontFamily: "'SF Mono', Menlo, Consolas, monospace", fontSize: "14px", lineHeight: "1.6" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#0969da" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": { backgroundColor: selectionColor },
    ".cm-content ::selection": { backgroundColor: selectionColor },
    ".cm-gutters": { backgroundColor: "#f6f8fa", color: "#636c76", border: "none", borderRight: "1px solid #d1d9e0" },
    ".cm-activeLineGutter": { backgroundColor: "#ebeef1" },
    ".cm-activeLine": { backgroundColor: "rgba(175, 184, 193, 0.16)" },
  }, { dark: false });
}

export function createDarkTheme(): Extension {
  const selectionColor = "#1f6feb66";

  return EditorView.theme({
    "&": { backgroundColor: "#0d1117", color: "#e6edf3" },
    ".cm-content": { caretColor: "#58a6ff", fontFamily: "'SF Mono', Menlo, Consolas, monospace", fontSize: "14px", lineHeight: "1.6" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#58a6ff" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": { backgroundColor: selectionColor },
    ".cm-content ::selection": { backgroundColor: selectionColor },
    ".cm-gutters": { backgroundColor: "#010409", color: "#484f58", border: "none", borderRight: "1px solid #21262d" },
    ".cm-activeLineGutter": { backgroundColor: "#161b22" },
    ".cm-activeLine": { backgroundColor: "rgba(110, 118, 129, 0.16)" },
  }, { dark: true });
}
