const DOTS_SPEED = 0.25;

/** Moves the background dots slower than the graph as it pans, which suggests depth. */
export function applyParallax(element: HTMLElement, pan: { x: number; y: number }) {
    element.style.setProperty("--dots-x", `${pan.x * DOTS_SPEED}px`);
    element.style.setProperty("--dots-y", `${pan.y * DOTS_SPEED}px`);
}
