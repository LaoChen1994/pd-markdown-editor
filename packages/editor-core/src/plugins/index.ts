import type { EditorPlugin, ToolbarContext, ToolbarItem, MarkdownEditorInstance } from "../types";
import type { Extension } from "@codemirror/state";
export type { EditorPlugin, ToolbarContext, ToolbarItem };

/** Plugin manager — handles lifecycle of all plugins */
export class PluginManager {
  private plugins: EditorPlugin[] = [];

  register(plugin: EditorPlugin): void {
    this.unregister(plugin.name);
    this.plugins.push(plugin);
  }

  unregister(name: string): boolean {
    const index = this.plugins.findIndex((plugin) => plugin.name === name);
    if (index === -1) return false;
    const [plugin] = this.plugins.splice(index, 1);
    plugin.destroy?.();
    return true;
  }

  install(plugin: EditorPlugin, editor: MarkdownEditorInstance): Extension[] {
    const ext = plugin.install?.(editor);
    if (!ext) return [];
    return Array.isArray(ext) ? ext : [ext];
  }

  installAll(editor: MarkdownEditorInstance): Extension[] {
    const extensions: Extension[] = [];
    for (const plugin of this.plugins) {
      extensions.push(...this.install(plugin, editor));
    }
    return extensions;
  }

  getToolbarItems(ctx: ToolbarContext): ToolbarItem[] {
    const items: ToolbarItem[] = [];
    for (const plugin of this.plugins) {
      if (plugin.toolbar) {
        const result = plugin.toolbar(ctx);
        if (result) {
          if (Array.isArray(result)) items.push(...result);
          else items.push(result);
        }
      }
    }
    return items;
  }

  notifyUpdate(value: string, editor: MarkdownEditorInstance): void {
    for (const plugin of this.plugins) {
      if (plugin.onUpdate) {
        plugin.onUpdate({ value, editor });
      }
    }
  }

  destroyAll(): void {
    for (const plugin of this.plugins) {
      if (plugin.destroy) plugin.destroy();
    }
    this.plugins = [];
  }
}
