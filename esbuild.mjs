import fs from 'fs';
import path from 'path';

import { build } from 'esbuild';


const baseConfig = {
  bundle: true,
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV !== "production",
};

const extensionConfig = {
  ...baseConfig,
  platform: "node",
  mainFields: ["module", "main"],
  format: "cjs",
  entryPoints: ["./src/extension.ts"],
  outfile: "./out/extension.cjs",
  external: ["vscode"],
};

const watchConfig = {
    watch: {
        onRebuild(error, result) {
            console.log("[watch] build started");
            if (error) {
                error.errors.forEach(error =>
                    console.error(`> ${error.location.file}:${error.location.line}:${error.location.column}: error: ${error.text}`)
                );
            } else {
                console.log("[watch] build finished");
            }
        },
    },
};

const webviewConfig = {
    ...baseConfig,
    target: "es2020",
    format: "esm",
};

async function buildWebviews(config) {
    const views = fs.readdirSync("./src/webviews");
    for (const view of views) {
        const viewName = path.basename(view, path.extname(view));
        await build({
            ...config,
            entryPoints: [`./src/webviews/${view}/main.mts`],
            outfile: `./out/${viewName}.js`,
        });
    }
}


/**
 * BUILD PIPELINE
 */
(async () => {
    const args = process.argv.slice(2);
    //try {
      if (args.includes("--watch")) {

        // Build and watch source code
        console.log("[watch] build started");
        await build({
          ...extensionConfig,
          ...watchConfig,
        });
        await buildWebviews({
          ...webviewConfig,
          ...watchConfig,
        });

        console.log("[watch] build finished");
      } else {

        // Build source code
        await build(extensionConfig);
        await buildWebviews(webviewConfig);
        
        console.log("build complete");
      }
    /*} catch (err) {
        process.stderr.write(err.stderr);
        process.exit(1);
    }*/
})();