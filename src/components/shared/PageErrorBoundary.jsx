import { Component } from "react";

class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("Page render error:", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError } = this.state;
    const { children, title = "Unable to load this page" } = this.props;

    if (!hasError) {
      return children;
    }

    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--admin-surface-border)] bg-[var(--admin-surface-bg)] p-8 text-center">
        <h2 className="admin-text text-lg font-semibold">{title}</h2>
        <p className="admin-text-muted max-w-md text-sm">
          Something went wrong while rendering this page. Please try again or return to the
          dashboard.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={this.handleRetry}
            className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49]"
          >
            Try Again
          </button>
          <a
            href="/"
            className="admin-btn-cancel inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }
}

export default PageErrorBoundary;
