// ============================================================================
// unity-loader.js  — Bootstraps a Unity 2022+ WebGL build inside a Blazor page.
//
// Called from PlayGame.razor via JS interop:
//   loadUnity(canvasId, loaderUrl, dataUrl, frameworkUrl, codeUrl, dotnetRef)
//
// Unity's createUnityInstance() is injected by the loader script at runtime.
// Progress, loaded, and error events are forwarded back to Blazor via the
// DotNetObjectReference (dotnetRef) so the C# component can update its UI.
// ============================================================================

let unityInstance = null;

/**
 * Dynamically inject Unity's loader script, then call createUnityInstance().
 */
export async function loadUnity(canvasId, loaderUrl, dataUrl, frameworkUrl, codeUrl, dotnetRef) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) throw new Error(`Canvas element #${canvasId} not found.`);

  // Inject Unity's loader <script> tag if not already present.
  await injectScript(loaderUrl);

  if (typeof createUnityInstance === "undefined") {
    throw new Error("Unity loader script did not expose createUnityInstance(). " +
      "Check that loaderUrl points to the correct .loader.js file.");
  }

  try {
    unityInstance = await createUnityInstance(canvas, {
      dataUrl,
      frameworkUrl,
      codeUrl,
      streamingAssetsUrl: "StreamingAssets",
      companyName: "GlitchStudio",
      productName: "GlitchGame",
      productVersion: "1.0",
    }, (progress) => {
      // progress is 0.0 → 1.0
      dotnetRef.invokeMethodAsync("OnProgress", progress).catch(() => {});
    });

    dotnetRef.invokeMethodAsync("OnLoaded").catch(() => {});
  } catch (err) {
    dotnetRef.invokeMethodAsync("OnError", String(err)).catch(() => {});
    throw err;
  }
}

/**
 * Request fullscreen on the canvas wrapper element.
 */
export function goFullscreen(wrapperId) {
  const el = document.getElementById(wrapperId);
  if (!el) return;
  const req = el.requestFullscreen
    || el.webkitRequestFullscreen
    || el.mozRequestFullScreen
    || el.msRequestFullscreen;
  if (req) req.call(el);
}

/**
 * Cleanly quit the Unity instance if it was created.
 * Call this when the Blazor component is disposed (page navigation away).
 */
export async function unloadUnity() {
  if (unityInstance) {
    try {
      await unityInstance.Quit();
    } catch (_) {
      // Quit() can throw if the WASM context is already gone — safe to ignore.
    }
    unityInstance = null;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function injectScript(src) {
  return new Promise((resolve, reject) => {
    // Don't inject twice.
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}
