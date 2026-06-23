import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#020202] px-4">
          <div className="text-center max-w-sm">
            <p className="text-zinc-400 text-sm font-mono mb-2">Something went wrong</p>
            <p className="text-zinc-600 text-[10px] mb-4 font-mono">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-200 border border-[#161619] rounded px-3 py-1.5 transition-colors cursor-pointer"
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
