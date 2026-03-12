"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Top 50 countries by internet users
const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CN", name: "China" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "JP", name: "Japan" },
  { code: "DE", name: "Germany" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "RU", name: "Russia" },
  { code: "ID", name: "Indonesia" },
  { code: "KR", name: "South Korea" },
  { code: "MX", name: "Mexico" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "CA", name: "Canada" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "TR", name: "Turkey" },
  { code: "AU", name: "Australia" },
  { code: "PH", name: "Philippines" },
  { code: "PK", name: "Pakistan" },
  { code: "NG", name: "Nigeria" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "EG", name: "Egypt" },
  { code: "AR", name: "Argentina" },
  { code: "UA", name: "Ukraine" },
  { code: "MY", name: "Malaysia" },
  { code: "NL", name: "Netherlands" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "PL", name: "Poland" },
  { code: "SE", name: "Sweden" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PT", name: "Portugal" },
  { code: "CZ", name: "Czech Republic" },
  { code: "RO", name: "Romania" },
  { code: "HU", name: "Hungary" },
  { code: "GR", name: "Greece" },
  { code: "AE", name: "UAE" },
  { code: "IL", name: "Israel" },
  { code: "HK", name: "Hong Kong" },
  { code: "TW", name: "Taiwan" },
  { code: "NZ", name: "New Zealand" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
];

export type GeoRule = { country: string; url: string };

interface GeoRulesInputProps {
  rules: GeoRule[];
  onChange: (rules: GeoRule[]) => void;
}

export function GeoRulesInput({ rules, onChange }: GeoRulesInputProps) {
  function addRule() {
    onChange([...rules, { country: "", url: "" }]);
  }

  function removeRule(i: number) {
    onChange(rules.filter((_, idx) => idx !== i));
  }

  function update(i: number, field: keyof GeoRule, value: string) {
    onChange(rules.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  const usedCountries = new Set(rules.map((r) => r.country));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Geographic redirects</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addRule}
          className="h-7 text-xs gap-1"
        >
          <Plus className="h-3 w-3" />
          Add rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Redirect visitors from specific countries to different URLs.
        </p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                className="flex h-9 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={rule.country}
                onChange={(e) => update(i, "country", e.target.value)}
              >
                <option value="">Country</option>
                {COUNTRIES.filter(
                  (c) => !usedCountries.has(c.code) || c.code === rule.country
                ).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="https://example.com/localized"
                value={rule.url}
                onChange={(e) => update(i, "url", e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 shrink-0"
                onClick={() => removeRule(i)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
