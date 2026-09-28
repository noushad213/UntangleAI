const fs = require('fs');
const path = require('path');

function patchFile(filePath, transforms) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const { target, replacement } of transforms) {
    if (content.includes(target)) {
      content = content.replace(target, replacement);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-next] Patched: ${filePath}`);
  }
}

// 1. Patch load-components.js to correctly resolve _not-found client manifests
const loadComponentsPatch = {
  target: 'return context.__RSC_MANIFEST[entryName];\n    } catch (err) {\n        return undefined;\n    }',
  replacement: `return context.__RSC_MANIFEST[entryName] || (entryName === "/_not-found" ? context.__RSC_MANIFEST["/_not-found/page"] : undefined);
    } catch (err) {
        if (entryName === "/_not-found") {
            try {
                const altPath = manifestPath.replace("_not-found_client-reference-manifest.js", (0, _path.join)("_not-found", "page_client-reference-manifest.js"));
                const context = await evalManifestWithRetries(altPath, attempts);
                return context.__RSC_MANIFEST["/_not-found/page"] || context.__RSC_MANIFEST["/_not-found"];
            } catch (e) {}
        }
        return undefined;
    }`
};

patchFile(path.join(__dirname, '../node_modules/next/dist/server/load-components.js'), [loadComponentsPatch]);

// 2. Patch app-render.js to safely default undefined clientReferenceManifest
const appRenderPatch = {
  target: 'const clientReferenceManifest = renderOpts.clientReferenceManifest;',
  replacement: 'const clientReferenceManifest = renderOpts.clientReferenceManifest || { clientModules: {}, ssrModuleMapping: {}, edgeSSRModuleMapping: {}, entryCSSFiles: {} };'
};

patchFile(path.join(__dirname, '../node_modules/next/dist/server/app-render/app-render.js'), [appRenderPatch]);
patchFile(path.join(__dirname, '../node_modules/next/dist/esm/server/app-render/app-render.js'), [appRenderPatch]);

// 3. Patch compiled dev runtimes
const compiledDevPatch1 = {
  target: 'W=a.clientReferenceManifest,',
  replacement: 'W=a.clientReferenceManifest||{clientModules:{},ssrModuleMapping:{},edgeSSRModuleMapping:{},entryCSSFiles:{}},'
};
const compiledDevPatch2 = {
  target: 'e.clientReferenceManifest.clientModules',
  replacement: '(e.clientReferenceManifest||{}).clientModules'
};

patchFile(path.join(__dirname, '../node_modules/next/dist/compiled/next-server/app-page.runtime.dev.js'), [compiledDevPatch1, compiledDevPatch2]);
patchFile(path.join(__dirname, '../node_modules/next/dist/compiled/next-server/app-page-experimental.runtime.dev.js'), [compiledDevPatch1, compiledDevPatch2]);
