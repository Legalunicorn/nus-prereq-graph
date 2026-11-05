import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { STORAGE_KEY } from "../constants";
import "./ErrorBoundary.css";

interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { failed: boolean; }

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { failed: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { failed: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(error, info.componentStack);
    }

    private handleReset = () => {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    };

    render() {
        if (!this.state.failed) return this.props.children;
        return (
            <div className="error-screen" role="alert">
                <h1>Something went wrong</h1>
                <p>Your saved list may contain something the app can't display. Try reloading first. Resetting clears your saved modules.</p>
                <div className="error-screen-actions">
                    <button onClick={() => location.reload()}>Reload</button>
                    <button onClick={this.handleReset}>Reset my list</button>
                </div>
            </div>
        );
    }
}
