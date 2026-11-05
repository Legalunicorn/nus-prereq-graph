const POPUP_WIDTH = 190;
const POPUP_MAX_HEIGHT = 200;
const POPUP_OFFSET = 14; // Matches the transform in NodePopup.css
const MARGIN = 8;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

export function popupPosition(x: number, y: number, areaWidth: number, areaHeight: number) {
    return {
        x: clamp(x, POPUP_WIDTH / 2 + MARGIN, areaWidth - POPUP_WIDTH / 2 - MARGIN),
        y: clamp(y, 0, areaHeight - POPUP_MAX_HEIGHT - POPUP_OFFSET - MARGIN),
    };
}
