import { useEffect, useEffectEvent, useState } from "react"

export type InspectorMode = "open" | "compressed" | "collapsed"

const INSPECTOR_BREAKPOINT = "(max-width: 1280px)"
const STACKED_BREAKPOINT = "(max-width: 1024px)"

function getMatches(query: string) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false
  }

  return window.matchMedia(query).matches
}

function getAdaptiveMode(): Exclude<InspectorMode, "collapsed"> {
  return getMatches(INSPECTOR_BREAKPOINT) ? "compressed" : "open"
}

export function useResponsiveInspector() {
  const [mode, setMode] = useState<InspectorMode>(() => getAdaptiveMode())
  const [isStackedLayout, setIsStackedLayout] = useState(() =>
    getMatches(STACKED_BREAKPOINT)
  )

  const handleInspectorBreakpoint = useEffectEvent(
    (event: MediaQueryListEvent | { matches: boolean }) => {
      setMode((currentMode) => {
        if (currentMode === "collapsed") {
          return currentMode
        }

        return event.matches ? "compressed" : "open"
      })
    }
  )

  const handleStackedBreakpoint = useEffectEvent(
    (event: MediaQueryListEvent | { matches: boolean }) => {
      setIsStackedLayout(event.matches)
    }
  )

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return
    }

    const inspectorMediaQuery = window.matchMedia(INSPECTOR_BREAKPOINT)
    const stackedMediaQuery = window.matchMedia(STACKED_BREAKPOINT)

    if (typeof inspectorMediaQuery.addEventListener === "function") {
      inspectorMediaQuery.addEventListener("change", handleInspectorBreakpoint)
      stackedMediaQuery.addEventListener("change", handleStackedBreakpoint)
    } else {
      inspectorMediaQuery.addListener(handleInspectorBreakpoint)
      stackedMediaQuery.addListener(handleStackedBreakpoint)
    }

    return () => {
      if (typeof inspectorMediaQuery.removeEventListener === "function") {
        inspectorMediaQuery.removeEventListener(
          "change",
          handleInspectorBreakpoint
        )
        stackedMediaQuery.removeEventListener("change", handleStackedBreakpoint)
      } else {
        inspectorMediaQuery.removeListener(handleInspectorBreakpoint)
        stackedMediaQuery.removeListener(handleStackedBreakpoint)
      }
    }
  }, [handleInspectorBreakpoint, handleStackedBreakpoint])

  function restoreAdaptiveMode() {
    setMode(getAdaptiveMode())
  }

  function revealInspector() {
    setMode((currentMode) =>
      currentMode === "collapsed" ? getAdaptiveMode() : currentMode
    )
  }

  return {
    isStackedLayout,
    mode,
    restoreAdaptiveMode,
    revealInspector,
    setMode,
  }
}
