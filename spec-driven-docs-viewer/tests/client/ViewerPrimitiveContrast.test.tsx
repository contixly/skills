import "@testing-library/jest-dom/vitest"
import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select"

describe("viewer primitive contrast", () => {
  test("uses stronger contrast defaults for outline controls", () => {
    render(
      <>
        <Button variant="outline">Inspect</Button>
        <Badge variant="outline">review-queue</Badge>
        <Input aria-label="Feature search" />
        <Select>
          <SelectTrigger aria-label="Workspace source">
            <SelectValue placeholder="Choose source" />
          </SelectTrigger>
        </Select>
      </>
    )

    expect(screen.getByRole("button", { name: "Inspect" })).toHaveClass(
      "bg-background/88"
    )
    expect(screen.getByText("review-queue")).toHaveClass("border-border/90")
    expect(screen.getByRole("textbox", { name: "Feature search" })).toHaveClass(
      "bg-background/88"
    )
    expect(
      screen.getByRole("combobox", { name: "Workspace source" })
    ).toHaveClass(
      "border-border/90",
      "bg-background/88",
      "shadow-[inset_0_1px_0_oklch(1_0_0_/_0.45)]",
      "data-[size=default]:h-10"
    )
  })

  test("keeps cards and empty states visually separated from their containers", () => {
    render(
      <>
        <Card>
          <CardContent>Packet detail</CardContent>
        </Card>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Select a packet</EmptyTitle>
            <EmptyDescription>Inspect metadata from here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </>
    )

    expect(
      screen.getByText("Packet detail").closest("[data-slot='card']")
    ).toHaveClass("ring-border/70")
    expect(
      screen.getByText("Select a packet").closest("[data-slot='empty']")
    ).toHaveClass("bg-muted/24")
  })
})
