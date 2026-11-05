const NEAR_SPEED = 0.6;
const FAR_SPEED = 0.25;

/** Moves the two background dot layers at different speeds as the graph pans, which suggests depth. */
export function applyParallax(element: HTMLElement, pan: { x: number; y: number }) {
    element.style.setProperty("--near-x", `${pan.x * NEAR_SPEED}px`);
    element.style.setProperty("--near-y", `${pan.y * NEAR_SPEED}px`);
    element.style.setProperty("--far-x", `${pan.x * FAR_SPEED}px`);
    element.style.setProperty("--far-y", `${pan.y * FAR_SPEED}px`);
}
