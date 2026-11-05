import "./SharedPlanBanner.css";

interface SharedPlanBannerProps {
    count: number;
    hasError: boolean;
    onAccept: () => void;
    onDismiss: () => void;
}

export default function SharedPlanBanner({ count, hasError, onAccept, onDismiss }: SharedPlanBannerProps) {
    const summary = `Shared plan: ${count} ${count === 1 ? "module" : "modules"}`;
    return (
        <div className="shared-plan" role="status">
            <span>{hasError ? "Couldn't load the shared plan" : summary}</span>
            <button onClick={onAccept}>{hasError ? "Retry" : "Replace mine"}</button>
            <button onClick={onDismiss}>Ignore</button>
        </div>
    );
}
