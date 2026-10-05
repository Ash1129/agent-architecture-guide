import { Component, type ReactNode } from "react";

/** If the drawing ever fails, show the step list instead of a blank page. */
export class DiagramBoundary extends Component<{ fallback: ReactNode; resetKey: string; children: ReactNode }, { failed: boolean; key: string }> {
  state = { failed: false, key: this.props.resetKey };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: { resetKey: string }, state: { failed: boolean; key: string }) {
    return props.resetKey !== state.key ? { failed: false, key: props.resetKey } : null;
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
