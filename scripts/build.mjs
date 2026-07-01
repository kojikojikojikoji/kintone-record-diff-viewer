// Builds each plugin entry as a self-contained IIFE bundle in dist/.
// kintone loads plugin scripts as classic scripts, so every dependency is
// bundled and no ES module syntax is emitted. Mobile is not built (unsupported).
import { build } from "vite";

const watch = process.argv.includes("--watch");

const entries = {
  desktop: "src/desktop/index.ts",
  config: "src/config/index.ts",
};

const names = Object.keys(entries);

for (const name of names) {
  await build({
    configFile: false,
    logLevel: "info",
    build: {
      // Clear dist only on the first entry so later entries keep prior output.
      emptyOutDir: name === names[0],
      outDir: "dist",
      target: "es2019",
      cssCodeSplit: false,
      lib: {
        entry: entries[name],
        name: `kp_rdv_${name}`,
        formats: ["iife"],
        fileName: () => `${name}.js`,
      },
      rollupOptions: {
        output: { extend: true, inlineDynamicImports: true },
      },
      watch: watch ? {} : null,
      minify: !watch,
    },
  });
}
