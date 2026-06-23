// ============================================================================
// video-bg.js — Scroll-driven vertical pan for the city background video.
//
// The video element is taller than the viewport (its natural aspect ratio,
// scaled to fill viewport width). As the user scrolls from the top of the
// page to the bottom, we translateY the video upward so that:
//   - scrollY = 0           -> top of video visible (sky / building tops)
//   - scrollY = max scroll  -> bottom of video visible (street / roads)
//
// The video keeps playing/looping the entire time for ambient motion
// (lights, passing ships, traffic) independently of this pan.
// ============================================================================

let videoEl = null;
let rafId = null;
let resizeObserver = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updatePan() {
  rafId = null;
  if (!videoEl) return;

  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop || 0;
  const pageHeight = doc.scrollHeight - window.innerHeight;
  const scrollProgress = pageHeight > 0 ? clamp(scrollTop / pageHeight, 0, 1) : 0;

  const videoHeight = videoEl.offsetHeight;
  const viewportHeight = window.innerHeight;
  const maxTranslate = Math.max(videoHeight - viewportHeight, 0);

  const translateY = -(scrollProgress * maxTranslate);
  videoEl.style.transform = `translate(-50%, ${translateY}px)`;
}

function onScroll() {
  if (rafId === null) {
    rafId = requestAnimationFrame(updatePan);
  }
}

function tryPlay() {
  if (!videoEl) return;
  const playPromise = videoEl.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      // Autoplay can be blocked until the user interacts with the page.
      // Retry on first user gesture.
      const resume = () => {
        videoEl.play().catch(() => {});
        window.removeEventListener("click", resume);
        window.removeEventListener("touchstart", resume);
        window.removeEventListener("keydown", resume);
      };
      window.addEventListener("click", resume, { once: true });
      window.addEventListener("touchstart", resume, { once: true });
      window.addEventListener("keydown", resume, { once: true });
    });
  }
}

export function init(videoElementId) {
  videoEl = document.getElementById(videoElementId);
  if (!videoEl) return;

  tryPlay();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  // Recompute when the video metadata loads (so offsetHeight is accurate)
  // and whenever its rendered size changes (e.g. responsive width shifts).
  videoEl.addEventListener("loadedmetadata", updatePan);

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => updatePan());
    resizeObserver.observe(videoEl);
  }

  updatePan();
}

export function dispose() {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  videoEl = null;
}
