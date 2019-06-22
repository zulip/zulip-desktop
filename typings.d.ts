// TODO: TypeScript - Remove this when the typescript migration
// is done. Ideally we would do declare module only for our modules
// that are not yet converted but relative path module declaration
// are not supported
declare module '*';

declare var page_params: object;

// since requestIdleCallback didn't make it into lib.dom.d.ts yet
declare function requestIdleCallback(callback: Function, options?: object): void;

// This is mostly zulip side of code we access from window
interface Window {
  $: any;
  narrow: any;
}
