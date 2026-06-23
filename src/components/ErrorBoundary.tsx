import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-zinc-950">
          <div className="text-center">
            <p className="text-zinc-400 text-sm mb-3">Something went wrong</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-zinc-600 hover:text-zinc-300 border border-zinc-800 rounded px-3 py-1.5 transition-colors cursor-pointer"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
