import type { Status } from "@/shared/contracts"

const STATUS_THEME: Record<
  Status,
  {
    badgeClassName: string
    dotClassName: string
  }
> = {
  planned: {
    dotClassName: "bg-[oklch(0.78_0.04_82)]",
    badgeClassName:
      "border-[oklch(0.74_0.03_82)] bg-[oklch(0.95_0.015_82)] text-[oklch(0.42_0.03_72)]",
  },
  ready: {
    dotClassName: "bg-[oklch(0.8_0.04_145)]",
    badgeClassName:
      "border-[oklch(0.75_0.03_145)] bg-[oklch(0.95_0.015_145)] text-[oklch(0.42_0.03_145)]",
  },
  "in-progress": {
    dotClassName: "bg-[oklch(0.78_0.04_230)]",
    badgeClassName:
      "border-[oklch(0.74_0.03_230)] bg-[oklch(0.94_0.015_230)] text-[oklch(0.4_0.03_230)]",
  },
  blocked: {
    dotClassName: "bg-[oklch(0.8_0.035_18)]",
    badgeClassName:
      "border-[oklch(0.75_0.03_18)] bg-[oklch(0.95_0.015_18)] text-[oklch(0.45_0.03_18)]",
  },
  done: {
    dotClassName: "bg-[oklch(0.82_0.035_165)]",
    badgeClassName:
      "border-[oklch(0.77_0.03_165)] bg-[oklch(0.96_0.015_165)] text-[oklch(0.42_0.03_165)]",
  },
  superseded: {
    dotClassName: "bg-[oklch(0.78_0.02_300)]",
    badgeClassName:
      "border-[oklch(0.74_0.02_300)] bg-[oklch(0.95_0.01_300)] text-[oklch(0.43_0.02_300)]",
  },
  unknown: {
    dotClassName: "bg-[oklch(0.8_0.01_95)]",
    badgeClassName:
      "border-[oklch(0.75_0.01_95)] bg-[oklch(0.96_0.005_95)] text-[oklch(0.45_0.01_95)]",
  },
}

export function getStatusTheme(status: Status) {
  return STATUS_THEME[status]
}
