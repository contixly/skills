import { IconMoon, IconSun } from "@tabler/icons-react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <Button
      type="button"
      aria-label="Toggle theme"
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      variant="outline"
      size="icon-sm"
      className="tracker-control"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <IconSun /> : <IconMoon />}
    </Button>
  )
}
