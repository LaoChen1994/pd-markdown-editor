import type { EditorPlugin, ToolbarContext, ToolbarItem, MarkdownEditorInstance } from "../types";
export type { EditorPlugin, ToolbarContext, ToolbarItem };

/** Plugin manager — handles lifecycle of all plugins */
export class PluginManager {
  private plugins: EditorPlugin[] = [];

  register(plugin: EditorPlugin): void {
    this.plugins.push(plugin);
  }

  installAll(editor: MarkdownEditorInstance) {
    const extensions = [];
    for (const plugin of this.plugins) {
      if (plugin.install) {
        const ext = plugin.install(editor);
        if (ext) {
          if (Array.isArray(ext)) extensions.push(...ext);
          else extensions.push(ext);
        }
      }
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
