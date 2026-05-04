const STATE_TAX_RATES: Record<string, { state: string; rate: number }> = {
  AL: { state: "Alabama", rate: 4.0 },
  AK: { state: "Alaska", rate: 0.0 },
  AZ: { state: "Arizona", rate: 5.6 },
  AR: { state: "Arkansas", rate: 6.5 },
  CA: { state: "California", rate: 7.25 },
  CO: { state: "Colorado", rate: 2.9 },
  CT: { state: "Connecticut", rate: 6.35 },
  DE: { state: "Delaware", rate: 0.0 },
  FL: { state: "Florida", rate: 6.0 },
  GA: { state: "Georgia", rate: 4.0 },
  HI: { state: "Hawaii", rate: 4.0 },
  ID: { state: "Idaho", rate: 6.0 },
  IL: { state: "Illinois", rate: 6.25 },
  IN: { state: "Indiana", rate: 7.0 },
  IA: { state: "Iowa", rate: 6.0 },
  KS: { state: "Kansas", rate: 6.5 },
  KY: { state: "Kentucky", rate: 6.0 },
  LA: { state: "Louisiana", rate: 4.45 },
  ME: { state: "Maine", rate: 5.5 },
  MD: { state: "Maryland", rate: 6.0 },
  MA: { state: "Massachusetts", rate: 6.25 },
  MI: { state: "Michigan", rate: 6.0 },
  MN: { state: "Minnesota", rate: 6.875 },
  MS: { state: "Mississippi", rate: 7.0 },
  MO: { state: "Missouri", rate: 4.225 },
  MT: { state: "Montana", rate: 0.0 },
  NE: { state: "Nebraska", rate: 5.5 },
  NV: { state: "Nevada", rate: 6.85 },
  NH: { state: "New Hampshire", rate: 0.0 },
  NJ: { state: "New Jersey", rate: 6.625 },
  NM: { state: "New Mexico", rate: 4.875 },
  NY: { state: "New York", rate: 4.0 },
  NC: { state: "North Carolina", rate: 4.75 },
  ND: { state: "North Dakota", rate: 5.0 },
  OH: { state: "Ohio", rate: 5.75 },
  OK: { state: "Oklahoma", rate: 4.5 },
  OR: { state: "Oregon", rate: 0.0 },
  PA: { state: "Pennsylvania", rate: 6.0 },
  RI: { state: "Rhode Island", rate: 7.0 },
  SC: { state: "South Carolina", rate: 6.0 },
  SD: { state: "South Dakota", rate: 4.2 },
  TN: { state: "Tennessee", rate: 7.0 },
  TX: { state: "Texas", rate: 6.25 },
  UT: { state: "Utah", rate: 6.1 },
  VT: { state: "Vermont", rate: 6.0 },
  VA: { state: "Virginia", rate: 5.3 },
  WA: { state: "Washington", rate: 6.5 },
  DC: { state: "District of Columbia", rate: 6.0 },
  WV: { state: "West Virginia", rate: 6.0 },
  WI: { state: "Wisconsin", rate: 5.0 },
  WY: { state: "Wyoming", rate: 4.0 },
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

export interface TaxInfo {
  rate: number;
  state: string;
  stateAbbr: string;
}

export function getTaxRateForZip(zip: string): TaxInfo | null {
  const cleaned = zip.replace(/\D/g, "").slice(0, 5);
  if (cleaned.length !== 5) return null;

  const zipNum = parseInt(cleaned, 10);
  if (isNaN(zipNum)) return null;

  for (const [min, max, stateAbbr] of ZIP_TO_STATE) {
    if (zipNum >= min && zipNum <= max) {
      const entry = STATE_TAX_RATES[stateAbbr];
      if (entry) {
        return { rate: entry.rate, state: entry.state, stateAbbr };
      }
    }
  }
  return null;
}
