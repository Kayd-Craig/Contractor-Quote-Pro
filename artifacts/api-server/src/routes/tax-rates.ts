import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

interface TaxEntry {
  state: string;
  stateAbbr: string;
  rate: number;
}

const STATE_TAX_RATES: Record<string, TaxEntry> = {
  AL: { state: "Alabama", stateAbbr: "AL", rate: 4.0 },
  AK: { state: "Alaska", stateAbbr: "AK", rate: 0.0 },
  AZ: { state: "Arizona", stateAbbr: "AZ", rate: 5.6 },
  AR: { state: "Arkansas", stateAbbr: "AR", rate: 6.5 },
  CA: { state: "California", stateAbbr: "CA", rate: 7.25 },
  CO: { state: "Colorado", stateAbbr: "CO", rate: 2.9 },
  CT: { state: "Connecticut", stateAbbr: "CT", rate: 6.35 },
  DE: { state: "Delaware", stateAbbr: "DE", rate: 0.0 },
  FL: { state: "Florida", stateAbbr: "FL", rate: 6.0 },
  GA: { state: "Georgia", stateAbbr: "GA", rate: 4.0 },
  HI: { state: "Hawaii", stateAbbr: "HI", rate: 4.0 },
  ID: { state: "Idaho", stateAbbr: "ID", rate: 6.0 },
  IL: { state: "Illinois", stateAbbr: "IL", rate: 6.25 },
  IN: { state: "Indiana", stateAbbr: "IN", rate: 7.0 },
  IA: { state: "Iowa", stateAbbr: "IA", rate: 6.0 },
  KS: { state: "Kansas", stateAbbr: "KS", rate: 6.5 },
  KY: { state: "Kentucky", stateAbbr: "KY", rate: 6.0 },
  LA: { state: "Louisiana", stateAbbr: "LA", rate: 4.45 },
  ME: { state: "Maine", stateAbbr: "ME", rate: 5.5 },
  MD: { state: "Maryland", stateAbbr: "MD", rate: 6.0 },
  MA: { state: "Massachusetts", stateAbbr: "MA", rate: 6.25 },
  MI: { state: "Michigan", stateAbbr: "MI", rate: 6.0 },
  MN: { state: "Minnesota", stateAbbr: "MN", rate: 6.875 },
  MS: { state: "Mississippi", stateAbbr: "MS", rate: 7.0 },
  MO: { state: "Missouri", stateAbbr: "MO", rate: 4.225 },
  MT: { state: "Montana", stateAbbr: "MT", rate: 0.0 },
  NE: { state: "Nebraska", stateAbbr: "NE", rate: 5.5 },
  NV: { state: "Nevada", stateAbbr: "NV", rate: 6.85 },
  NH: { state: "New Hampshire", stateAbbr: "NH", rate: 0.0 },
  NJ: { state: "New Jersey", stateAbbr: "NJ", rate: 6.625 },
  NM: { state: "New Mexico", stateAbbr: "NM", rate: 4.875 },
  NY: { state: "New York", stateAbbr: "NY", rate: 4.0 },
  NC: { state: "North Carolina", stateAbbr: "NC", rate: 4.75 },
  ND: { state: "North Dakota", stateAbbr: "ND", rate: 5.0 },
  OH: { state: "Ohio", stateAbbr: "OH", rate: 5.75 },
  OK: { state: "Oklahoma", stateAbbr: "OK", rate: 4.5 },
  OR: { state: "Oregon", stateAbbr: "OR", rate: 0.0 },
  PA: { state: "Pennsylvania", stateAbbr: "PA", rate: 6.0 },
  RI: { state: "Rhode Island", stateAbbr: "RI", rate: 7.0 },
  SC: { state: "South Carolina", stateAbbr: "SC", rate: 6.0 },
  SD: { state: "South Dakota", stateAbbr: "SD", rate: 4.2 },
  TN: { state: "Tennessee", stateAbbr: "TN", rate: 7.0 },
  TX: { state: "Texas", stateAbbr: "TX", rate: 6.25 },
  UT: { state: "Utah", stateAbbr: "UT", rate: 6.1 },
  VT: { state: "Vermont", stateAbbr: "VT", rate: 6.0 },
  VA: { state: "Virginia", stateAbbr: "VA", rate: 5.3 },
  WA: { state: "Washington", stateAbbr: "WA", rate: 6.5 },
  DC: { state: "District of Columbia", stateAbbr: "DC", rate: 6.0 },
  WV: { state: "West Virginia", stateAbbr: "WV", rate: 6.0 },
  WI: { state: "Wisconsin", stateAbbr: "WI", rate: 5.0 },
  WY: { state: "Wyoming", stateAbbr: "WY", rate: 4.0 },
};

const ZIP_TO_STATE: [number, number, string][] = [
  [35000, 36999, "AL"],
  [99500, 99999, "AK"],
  [85000, 86599, "AZ"],
  [71600, 72999, "AR"],
  [90000, 96199, "CA"],
  [80000, 81699, "CO"],
  [6000, 6999, "CT"],
  [19700, 19999, "DE"],
  [32000, 34999, "FL"],
  [30000, 31999, "GA"],
  [96700, 96899, "HI"],
  [83200, 83899, "ID"],
  [60000, 62999, "IL"],
  [46000, 47999, "IN"],
  [50000, 52899, "IA"],
  [66000, 67999, "KS"],
  [40000, 42799, "KY"],
  [70000, 71599, "LA"],
  [3900, 4999, "ME"],
  [20600, 21999, "MD"],
  [1000, 2799, "MA"],
  [48000, 49999, "MI"],
  [55000, 56799, "MN"],
  [38600, 39799, "MS"],
  [63000, 65899, "MO"],
  [59000, 59999, "MT"],
  [68000, 69399, "NE"],
  [88900, 89899, "NV"],
  [3000, 3899, "NH"],
  [7000, 8999, "NJ"],
  [87000, 88499, "NM"],
  [10000, 14999, "NY"],
  [27000, 28999, "NC"],
  [58000, 58899, "ND"],
  [43000, 45999, "OH"],
  [73000, 74999, "OK"],
  [97000, 97999, "OR"],
  [15000, 19699, "PA"],
  [2800, 2999, "RI"],
  [29000, 29999, "SC"],
  [57000, 57799, "SD"],
  [37000, 38599, "TN"],
  [75000, 79999, "TX"],
  [73301, 73399, "TX"],
  [84000, 84799, "UT"],
  [5000, 5999, "VT"],
  [22000, 24699, "VA"],
  [20100, 20199, "VA"],
  [98000, 99499, "WA"],
  [20000, 20099, "DC"],
  [20200, 20599, "DC"],
  [24700, 26899, "WV"],
  [53000, 54999, "WI"],
  [82000, 83199, "WY"],
];

function getStateFromZip(zip: string): string | null {
  const zipNum = parseInt(zip, 10);
  if (isNaN(zipNum)) return null;

  for (const [min, max, state] of ZIP_TO_STATE) {
    if (zipNum >= min && zipNum <= max) return state;
  }
  return null;
}

router.get("/tax-rate", (req: Request, res: Response) => {
  const zip = (req.query["zip"] as string || "").trim();

  if (!zip || !/^\d{5}$/.test(zip)) {
    res.status(400).json({ error: "A valid 5-digit zip code is required" });
    return;
  }

  const stateAbbr = getStateFromZip(zip);
  if (!stateAbbr) {
    res.status(404).json({ error: "Could not determine state for this zip code", zip });
    return;
  }

  const entry = STATE_TAX_RATES[stateAbbr];
  if (!entry) {
    res.status(404).json({ error: "Tax rate not found for state", zip, state: stateAbbr });
    return;
  }

  res.json({
    zip,
    state: entry.state,
    stateAbbr: entry.stateAbbr,
    rate: entry.rate,
  });
});

export default router;
