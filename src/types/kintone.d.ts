// Minimal ambient declarations for the kintone globals this plugin uses.
// Only the members touched by the code are declared.

interface KintoneLoginUser {
  code: string;
  timeZone: string;
}

interface KintoneEvent {
  appId: number;
  recordId?: number;
  record?: Record<string, { type: string; value: unknown }>;
}

interface KintoneEvents {
  on(
    event: string | string[],
    handler: (e: KintoneEvent) => KintoneEvent | Promise<KintoneEvent>,
  ): void;
}

interface KintoneRecordNamespace {
  getHeaderMenuSpaceElement(): HTMLElement | null;
  getSpaceElement(code: string): HTMLElement | null;
}

interface KintoneAppNamespace {
  getId(): number | null;
  getHeaderMenuSpaceElement(): HTMLElement | null;
  record: KintoneRecordNamespace;
}

interface KintonePluginApp {
  getConfig(id: string): Record<string, string>;
  setConfig(config: Record<string, string>, callback?: () => void): void;
  getId(): string;
}

interface KintonePlugin {
  app: KintonePluginApp;
}

interface KintoneStatic {
  events: KintoneEvents;
  app: KintoneAppNamespace;
  plugin: KintonePlugin;
  getLoginUser(): KintoneLoginUser;
  // Injected by kintone into plugin scripts as the running plugin's id.
  $PLUGIN_ID: string;
}

declare const kintone: KintoneStatic;

interface Window {
  kintone: KintoneStatic;
}
