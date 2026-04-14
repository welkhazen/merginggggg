import { Check, MonitorCog, Moon, Sun } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/ThemeProvider";

export function ThemeCustomizer() {
  const { mode, accent, accentPresets, setMode, setAccent } = useTheme();
  const isLightMode = mode === "light";

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[90]">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="pointer-events-auto h-12 w-12 rounded-2xl border border-raw-border/40 bg-raw-surface/90 text-raw-gold shadow-[0_18px_45px_rgb(var(--raw-black)/0.22)] backdrop-blur-xl hover:bg-raw-surface"
          >
            <MonitorCog className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={12} className="w-[320px] rounded-3xl border border-raw-border/40 bg-raw-surface/95 p-0 text-raw-text shadow-2xl backdrop-blur-xl">
          <div className="border-b border-raw-border/25 px-5 py-4">
            <p className="font-display text-sm tracking-[0.18em] text-raw-text">Theme Studio</p>
            <p className="mt-2 text-xs leading-relaxed text-raw-silver/50">
              Change light or dark mode once and keep the same accent color across every page.
            </p>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div className="rounded-2xl border border-raw-border/25 bg-raw-black/25 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-raw-silver/45">Mode</p>
                  <p className="mt-1 text-sm text-raw-text">{isLightMode ? "Light mode" : "Dark mode"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Moon className={cn("h-4 w-4", !isLightMode ? "text-raw-gold" : "text-raw-silver/35")} />
                  <Switch checked={isLightMode} onCheckedChange={(checked) => setMode(checked ? "light" : "dark")} />
                  <Sun className={cn("h-4 w-4", isLightMode ? "text-raw-gold" : "text-raw-silver/35")} />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-raw-silver/45">Accent</p>
                  <p className="mt-1 text-sm text-raw-silver/65">10 saved accent choices for the full app</p>
                </div>
                <div className="rounded-full border border-raw-border/30 bg-raw-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-raw-gold/80">
                  {accentPresets.find((preset) => preset.id === accent)?.label}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-5 gap-3">
                {accentPresets.map((preset) => {
                  const selected = preset.id === accent;

                  return (
                    <button
                      key={preset.id}
                      onClick={() => setAccent(preset.id)}
                      className={cn(
                        "relative flex h-12 w-full items-center justify-center rounded-2xl border transition-all",
                        selected
                          ? "border-raw-text shadow-[0_0_0_1px_rgb(var(--raw-text)/0.25)]"
                          : "border-raw-border/35 hover:border-raw-silver/30",
                      )}
                      style={{ backgroundColor: `rgb(${preset.rgb})` }}
                      aria-label={`Use ${preset.label} accent`}
                      title={preset.label}
                    >
                      {selected && <Check className="h-4 w-4 text-raw-ink" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}