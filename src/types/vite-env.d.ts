/// <reference types="vite/client" />

// CSS imported with ?inline is returned as a string for runtime injection.
declare module "*.css?inline" {
  const css: string;
  export default css;
}
