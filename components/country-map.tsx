"use client";

import { useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

// ISO alpha-2 to ISO numeric (UN M49) mapping — covers top countries by internet traffic
const ISO2_TO_NUMERIC: Record<string, number> = {
  AF: 4, AL: 8, DZ: 12, AD: 20, AO: 24, AR: 32, AM: 51, AU: 36, AT: 40, AZ: 31,
  BS: 44, BH: 48, BD: 50, BY: 112, BE: 56, BZ: 84, BJ: 204, BT: 64, BO: 68, BA: 70,
  BW: 72, BR: 76, BN: 96, BG: 100, BF: 854, BI: 108, KH: 116, CM: 120, CA: 124,
  CF: 140, TD: 148, CL: 152, CN: 156, CO: 170, CD: 180, CG: 178, CR: 188, CI: 384,
  HR: 191, CU: 192, CY: 196, CZ: 203, DK: 208, DJ: 262, DO: 214, EC: 218, EG: 818,
  SV: 222, GQ: 226, ER: 232, EE: 233, ET: 231, FJ: 242, FI: 246, FR: 250, GA: 266,
  GM: 270, GE: 268, DE: 276, GH: 288, GR: 300, GT: 320, GN: 324, GW: 624, GY: 328,
  HT: 332, HN: 340, HK: 344, HU: 348, IS: 352, IN: 356, ID: 360, IR: 364, IQ: 368,
  IE: 372, IL: 376, IT: 380, JM: 388, JP: 392, JO: 400, KZ: 398, KE: 404, KP: 408,
  KR: 410, KW: 414, KG: 417, LA: 418, LV: 428, LB: 422, LS: 426, LR: 430, LY: 434,
  LT: 440, LU: 442, MG: 450, MW: 454, MY: 458, MV: 462, ML: 466, MT: 470, MR: 478,
  MU: 480, MX: 484, MD: 498, MN: 496, ME: 499, MA: 504, MZ: 508, MM: 104, NA: 516,
  NP: 524, NL: 528, NZ: 554, NI: 558, NE: 562, NG: 566, MK: 807, NO: 578, OM: 512,
  PK: 586, PA: 591, PG: 598, PY: 600, PE: 604, PH: 608, PL: 616, PT: 620, PR: 630,
  QA: 634, RO: 642, RU: 643, RW: 646, SA: 682, SN: 686, RS: 688, SL: 694, SG: 702,
  SK: 703, SI: 705, SO: 706, ZA: 710, SS: 728, ES: 724, LK: 144, SD: 729, SR: 740,
  SE: 752, CH: 756, SY: 760, TW: 158, TJ: 762, TZ: 834, TH: 764, TL: 626, TG: 768,
  TO: 776, TT: 780, TN: 788, TR: 792, TM: 795, UG: 800, UA: 804, AE: 784, GB: 826,
  US: 840, UY: 858, UZ: 860, VU: 548, VE: 862, VN: 704, YE: 887, ZM: 894, ZW: 716,
};

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CountryMapProps {
  data: { name: string; count: number }[];
}

function getColor(count: number, max: number): string {
  if (count === 0 || max === 0) return "hsl(222, 28%, 14%)";
  const intensity = count / max;
  const l = Math.round(45 - intensity * 30); // 45% → 15%
  return `hsl(190, 95%, ${l}%)`;
}

export function CountryMap({ data }: CountryMapProps) {
  const countByNumeric = useMemo(() => {
    const map: Record<number, { count: number; name: string }> = {};
    for (const { name, count } of data) {
      const numeric = ISO2_TO_NUMERIC[name.toUpperCase()];
      if (numeric !== undefined) map[numeric] = { count, name };
    }
    return map;
  }, [data]);

  const max = useMemo(
    () => Math.max(1, ...data.map((d) => d.count)),
    [data]
  );

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No data yet.
      </p>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden bg-card border">
      <ComposableMap
        projectionConfig={{ scale: 140, center: [0, 20] }}
        style={{ width: "100%", height: "auto" }}
        viewBox="0 0 800 400"
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numericId = parseInt(geo.id, 10);
                const entry = countByNumeric[numericId];
                const fill = getColor(entry?.count ?? 0, max);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="hsl(222, 47%, 8%)"
                    strokeWidth={0.4}
                    title={entry ? `${entry.name}: ${entry.count} clicks` : undefined}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        fill: "hsl(190, 95%, 60%)",
                        outline: "none",
                        cursor: entry ? "pointer" : "default",
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 px-4 pb-3 text-xs text-muted-foreground">
        <span>0</span>
        <div
          className="h-2 w-24 rounded"
          style={{
            background:
              "linear-gradient(to right, hsl(222, 28%, 14%), hsl(190, 95%, 45%))",
          }}
        />
        <span>{max.toLocaleString()} clicks</span>
      </div>
    </div>
  );
}
