let scrollHandler = null;

export function initVideoScroll(videoElement) {
    if (!videoElement) return;

    // Force the browser's native media engine to start playback
    if (videoElement.paused) {
        videoElement.muted = true; // Double-insure it's muted so the browser allows it
        videoElement.play().catch(error => {
            console.warn("Native autoplay kickstart encountered an issue:", error);
        });
    }

    scrollHandler = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

        if (scrollHeight <= 0) return;

        const scrollPercent = scrollTop / scrollHeight;
        const maxShift = videoElement.offsetHeight - window.innerHeight;

        if (maxShift > 0) {
            const translateY = -(scrollPercent * maxShift);
            videoElement.style.transform = `translate3d(-50%, ${translateY}px, 0)`;
        }
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('resize', scrollHandler, { passive: true });

    setTimeout(scrollHandler, 100);
}

export function destroyVideoScroll() {
    if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler);
        window.removeEventListener('resize', scrollHandler);
        scrollHandler = null;
    }
}