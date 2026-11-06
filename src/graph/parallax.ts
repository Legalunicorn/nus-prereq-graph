const DOTS_SPEED = 0.25;
const DOT_SPACING = 16;

/** Moves the dots slower than the graph as it pans. They repeat, so a small offset on their own layer avoids repainting. */
export function applyParallax(dots: HTMLElement, pan: { x: number; y: number }) {
    const x = (pan.x * DOTS_SPEED) % DOT_SPACING;
    const y = (pan.y * DOTS_SPEED) % DOT_SPACING;
    dots.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}
