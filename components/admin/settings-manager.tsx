"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Settings2, CheckCircle2 } from "lucide-react"

interface SettingsManagerProps {
  initialSettings?: Record<string, string>
}

export function SettingsManager({ initialSettings = {} }: SettingsManagerProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState(initialSettings)

  const handleToggle = async (key: string) => {
    setLoading(true)
    try {
      const currentValue = settings[key] === "true"
      const newValue = String(!currentValue)

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setting_key: key,
          setting_value: newValue,
        }),
      })

      if (!response.ok) throw new Error("Failed to update setting")

      setSettings((prev) => ({
        ...prev,
        [key]: newValue,
      }))

      toast({
        title: "Success",
        description: `Setting updated to ${newValue === "true" ? "ON" : "OFF"}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isShowingAll = settings["show_all_medicines_on_homepage"] === "true"

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="h-5 w-5 text-primary" />
          <span>Display settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="font-medium text-foreground">Show all medicines on homepage</p>
            <p className="text-sm text-muted-foreground">
              Display the complete catalog from the database instead of only featured options.
            </p>
          </div>
          <Button
            onClick={() => handleToggle("show_all_medicines_on_homepage")}
            disabled={loading}
            variant={isShowingAll ? "default" : "outline"}
            className="whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isShowingAll ? (
              "ON"
            ) : (
              "OFF"
            )}
          </Button>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Current status
          </div>
          <p className="mt-2">
            {isShowingAll
              ? "All medicines from the database are currently displayed on the homepage."
              : "Only featured medicines from partner pharmacies are currently displayed."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
