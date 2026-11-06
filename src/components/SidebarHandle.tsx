import useSidebarWidth from "../hooks/useSidebarWidth";

const KEY_STEP = 24;

export default function SidebarHandle() {
    const { width, resize } = useSidebarWidth();
    const setIsResizing = (isResizing: boolean) => document.documentElement.toggleAttribute("data-resizing", isResizing);

    return (
        <div
            className="sidebar-handle"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            aria-valuenow={width}
            tabIndex={0}
            onPointerDown={event => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setIsResizing(true);
            }}
            onPointerMove={event => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    resize(event.clientX);
                }
            }}
            onPointerUp={() => setIsResizing(false)}
            onPointerCancel={() => setIsResizing(false)}
            onKeyDown={event => {
                if (event.key === "ArrowLeft") {
                    resize(width - KEY_STEP);
                } else if (event.key === "ArrowRight") {
                    resize(width + KEY_STEP);
                }
            }}
        />
    );
}
