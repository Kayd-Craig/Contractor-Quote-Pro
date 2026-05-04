import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

interface MockProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  unit: string;
  store: "homedepot" | "lowes";
  sku: string;
  category: string;
  inStock: boolean;
  contractorPrice?: number;
}

const MOCK_PRODUCTS: MockProduct[] = [
  // Lumber
  { id: "hd-001", name: '2x4x8 Framing Stud', brand: 'Spruce-Pine-Fir', price: 5.49, contractorPrice: 4.89, unit: 'each', store: 'homedepot', sku: '161640', category: 'Lumber', inStock: true },
  { id: "hd-002", name: '2x6x8 Douglas Fir', brand: 'Fir', price: 8.97, contractorPrice: 7.99, unit: 'each', store: 'homedepot', sku: '161641', category: 'Lumber', inStock: true },
  { id: "hd-003", name: '4x8 OSB Sheathing 7/16"', brand: 'LP BuilderSeries', price: 16.98, contractorPrice: 14.89, unit: 'sheet', store: 'homedepot', sku: '101374', category: 'Lumber', inStock: true },
  { id: "lw-001", name: '2x4x8 Premium Stud', brand: 'West Fraser', price: 5.78, contractorPrice: 5.12, unit: 'each', store: 'lowes', sku: 'WF2048', category: 'Lumber', inStock: true },
  { id: "lw-002", name: '4x8 Plywood Sheathing 1/2"', brand: 'GP', price: 31.18, contractorPrice: 27.50, unit: 'sheet', store: 'lowes', sku: 'PL4812', category: 'Lumber', inStock: true },
  // Drywall
  { id: "hd-010", name: '4x8 Drywall 1/2"', brand: 'USG', price: 14.97, contractorPrice: 12.50, unit: 'sheet', store: 'homedepot', sku: '175702', category: 'Drywall', inStock: true },
  { id: "hd-011", name: '4x12 Drywall 1/2"', brand: 'National Gypsum', price: 22.47, contractorPrice: 19.80, unit: 'sheet', store: 'homedepot', sku: '175703', category: 'Drywall', inStock: true },
  { id: "lw-010", name: '4x8 Drywall 5/8" Type X', brand: 'USG', price: 17.43, contractorPrice: 15.20, unit: 'sheet', store: 'lowes', sku: 'USG4858', category: 'Drywall', inStock: true },
  // Insulation
  { id: "hd-020", name: 'R-13 Kraft Faced Insulation 3.5"', brand: "Owens Corning", price: 39.95, contractorPrice: 35.20, unit: 'bag', store: 'homedepot', sku: '202769', category: 'Insulation', inStock: true },
  { id: "lw-020", name: 'R-19 Unfaced Insulation 6.25"', brand: 'Knauf', price: 52.48, contractorPrice: 46.00, unit: 'bag', store: 'lowes', sku: 'KN1906', category: 'Insulation', inStock: false },
  // Flooring
  { id: "hd-030", name: 'Trafficmaster Laminate Flooring 7mm', brand: 'TrafficMaster', price: 0.68, contractorPrice: 0.59, unit: 'sq ft', store: 'homedepot', sku: '368398', category: 'Flooring', inStock: true },
  { id: "hd-031", name: 'LifeProof Vinyl Plank Flooring 5mm', brand: 'LifeProof', price: 2.88, contractorPrice: 2.49, unit: 'sq ft', store: 'homedepot', sku: '301904', category: 'Flooring', inStock: true },
  { id: "lw-030", name: 'ReliaBilt LVP Flooring 6mm', brand: 'ReliaBilt', price: 1.99, contractorPrice: 1.74, unit: 'sq ft', store: 'lowes', sku: 'RB6LVP', category: 'Flooring', inStock: true },
  // Concrete & Masonry
  { id: "hd-040", name: 'Quikrete 80lb Concrete Mix', brand: 'Quikrete', price: 7.98, contractorPrice: 6.89, unit: 'bag', store: 'homedepot', sku: '110180', category: 'Concrete', inStock: true },
  { id: "hd-041", name: 'Quikrete 60lb Fast Setting Concrete', brand: 'Quikrete', price: 8.47, contractorPrice: 7.49, unit: 'bag', store: 'homedepot', sku: '100450', category: 'Concrete', inStock: true },
  { id: "lw-040", name: 'Sakrete 80lb Concrete Mix', brand: 'Sakrete', price: 7.28, contractorPrice: 6.49, unit: 'bag', store: 'lowes', sku: 'SK8001', category: 'Concrete', inStock: true },
  // Paint
  { id: "hd-050", name: 'Behr Premium Interior Paint + Primer 1 gal', brand: 'Behr', price: 42.98, contractorPrice: 37.50, unit: 'gallon', store: 'homedepot', sku: '105301', category: 'Paint', inStock: true },
  { id: "hd-051", name: 'Behr Exterior Paint + Primer 1 gal', brand: 'Behr', price: 49.98, contractorPrice: 43.00, unit: 'gallon', store: 'homedepot', sku: '437301', category: 'Paint', inStock: true },
  { id: "lw-050", name: "Valspar Signature Interior Paint 1 gal", brand: 'Valspar', price: 39.98, contractorPrice: 35.20, unit: 'gallon', store: 'lowes', sku: 'VS1GAL', category: 'Paint', inStock: true },
  // Plumbing
  { id: "hd-060", name: '1/2" PVC Pipe 10ft', brand: 'Charlotte Pipe', price: 2.62, contractorPrice: 2.28, unit: 'each', store: 'homedepot', sku: '302673', category: 'Plumbing', inStock: true },
  { id: "hd-061", name: '3/4" Copper Pipe Type L 10ft', brand: 'Mueller', price: 26.81, contractorPrice: 23.50, unit: 'each', store: 'homedepot', sku: '702319', category: 'Plumbing', inStock: true },
  { id: "lw-060", name: '1/2" CPVC Pipe 10ft', brand: 'NIBCO', price: 3.18, contractorPrice: 2.78, unit: 'each', store: 'lowes', sku: 'NB05CPV', category: 'Plumbing', inStock: false },
  // Electrical
  { id: "hd-070", name: '12/2 Romex NM-B Wire 25ft', brand: 'Southwire', price: 26.98, contractorPrice: 23.50, unit: 'roll', store: 'homedepot', sku: '206780', category: 'Electrical', inStock: true },
  { id: "hd-071", name: '14/2 Romex NM-B Wire 25ft', brand: 'Southwire', price: 18.97, contractorPrice: 16.49, unit: 'roll', store: 'homedepot', sku: '206770', category: 'Electrical', inStock: true },
  { id: "lw-070", name: '12/2 UF-B Wire 25ft', brand: 'Southwire', price: 29.48, contractorPrice: 25.90, unit: 'roll', store: 'lowes', sku: 'SW12UFB', category: 'Electrical', inStock: true },
  // Hardware
  { id: "hd-080", name: '16d 3.5" Framing Nails 1lb', brand: 'Grip-Rite', price: 9.97, contractorPrice: 8.50, unit: 'lb', store: 'homedepot', sku: '630690', category: 'Hardware', inStock: true },
  { id: "hd-081", name: '#8 Coarse Drywall Screws 1lb', brand: 'Grip-Rite', price: 7.48, contractorPrice: 6.39, unit: 'lb', store: 'homedepot', sku: '631640', category: 'Hardware', inStock: true },
  { id: "lw-080", name: 'Simpson Strong-Tie 2x4 Post Hanger', brand: 'Simpson', price: 2.87, contractorPrice: 2.49, unit: 'each', store: 'lowes', sku: 'SS24PH', category: 'Hardware', inStock: true },
  // Landscaping — Mulch & Ground Cover
  { id: "hd-090", name: 'Top Choice Pine Bark Mulch 2 cu ft', brand: 'Top Choice', price: 4.87, contractorPrice: 4.25, unit: 'bag', store: 'homedepot', sku: '100039', category: 'Landscaping', inStock: true },
  { id: "hd-091", name: 'Vigoro Black Rubber Mulch 0.8 cu ft', brand: 'Vigoro', price: 7.98, contractorPrice: 6.99, unit: 'bag', store: 'homedepot', sku: '301028', category: 'Landscaping', inStock: true },
  { id: "hd-092", name: 'River Rock 0.5 cu ft', brand: 'Vigoro', price: 5.98, contractorPrice: 5.20, unit: 'bag', store: 'homedepot', sku: '205025', category: 'Landscaping', inStock: true },
  { id: "hd-093", name: 'Vigoro Brown Mulch 2 cu ft', brand: 'Vigoro', price: 3.97, contractorPrice: 3.45, unit: 'bag', store: 'homedepot', sku: '100037', category: 'Landscaping', inStock: true },
  { id: "hd-094", name: 'Cedar Mulch 2 cu ft', brand: 'Top Choice', price: 5.47, contractorPrice: 4.75, unit: 'bag', store: 'homedepot', sku: '100040', category: 'Landscaping', inStock: true },
  { id: "lw-090", name: 'Premium Hardwood Mulch 2 cu ft', brand: 'EZStraw', price: 4.48, contractorPrice: 3.89, unit: 'bag', store: 'lowes', sku: 'EZ2CU', category: 'Landscaping', inStock: true },
  { id: "lw-091", name: 'Pea Gravel 0.5 cu ft', brand: 'Vigoro', price: 4.28, contractorPrice: 3.75, unit: 'bag', store: 'lowes', sku: 'VG05PG', category: 'Landscaping', inStock: true },
  { id: "lw-092", name: 'Landscape Fabric 3ft x 50ft', brand: 'Dewitt', price: 13.98, contractorPrice: 12.20, unit: 'roll', store: 'lowes', sku: 'DW3X50', category: 'Landscaping', inStock: true },
  { id: "lw-093", name: 'Red Cedar Mulch 2 cu ft', brand: 'Scotts', price: 4.68, contractorPrice: 4.10, unit: 'bag', store: 'lowes', sku: 'SC2RCM', category: 'Landscaping', inStock: true },
  // Landscaping — Soil & Amendments
  { id: "hd-095", name: 'Scotts Premium Topsoil 1 cu ft', brand: 'Scotts', price: 4.47, contractorPrice: 3.89, unit: 'bag', store: 'homedepot', sku: '100459', category: 'Topsoil', inStock: true },
  { id: "hd-096", name: 'Miracle-Gro Garden Soil 1.5 cu ft', brand: 'Miracle-Gro', price: 9.87, contractorPrice: 8.60, unit: 'bag', store: 'homedepot', sku: '70058300', category: 'Topsoil', inStock: true },
  { id: "lw-095", name: 'Premium Topsoil 0.75 cu ft', brand: 'Vigoro', price: 3.98, contractorPrice: 3.48, unit: 'bag', store: 'lowes', sku: 'VG75TS', category: 'Topsoil', inStock: true },
  { id: "lw-096", name: 'Espoma Organic Garden Soil 1 cu ft', brand: 'Espoma', price: 7.98, contractorPrice: 6.99, unit: 'bag', store: 'lowes', sku: 'ESP1GS', category: 'Topsoil', inStock: true },
  // Landscaping — Sod & Seed
  { id: "hd-097", name: 'Scotts Turf Builder Bermuda Grass Seed 5lb', brand: 'Scotts', price: 24.97, contractorPrice: 21.50, unit: 'bag', store: 'homedepot', sku: '17195', category: 'Seed', inStock: true },
  { id: "hd-098", name: 'Scotts EZ Seed Patch & Repair 10lb', brand: 'Scotts', price: 39.97, contractorPrice: 34.50, unit: 'bag', store: 'homedepot', sku: '17548', category: 'Seed', inStock: true },
  { id: "hd-099", name: 'Tall Fescue Grass Seed 7lb', brand: 'Pennington', price: 29.97, contractorPrice: 25.99, unit: 'bag', store: 'homedepot', sku: '100521', category: 'Seed', inStock: true },
  { id: "lw-097", name: 'Scotts Sun & Shade Grass Seed 3lb', brand: 'Scotts', price: 19.98, contractorPrice: 17.25, unit: 'bag', store: 'lowes', sku: 'SC3SS', category: 'Seed', inStock: true },
  { id: "lw-098", name: 'Kentucky Bluegrass Seed 3lb', brand: 'Pennington', price: 21.48, contractorPrice: 18.75, unit: 'bag', store: 'lowes', sku: 'PEN3KB', category: 'Seed', inStock: true },
  // Landscaping — Pavers & Edging
  { id: "hd-111", name: 'Pavestone 12x12 Square Concrete Paver', brand: 'Pavestone', price: 1.78, contractorPrice: 1.55, unit: 'each', store: 'homedepot', sku: '98006', category: 'Pavers', inStock: true },
  { id: "hd-112", name: 'Oldcastle 16x16 Concrete Step Stone', brand: 'Oldcastle', price: 4.47, contractorPrice: 3.89, unit: 'each', store: 'homedepot', sku: '80200', category: 'Pavers', inStock: true },
  { id: "hd-113", name: 'Pavestone Rumblestone 7.75x3.75 Wall Block', brand: 'Pavestone', price: 2.98, contractorPrice: 2.59, unit: 'each', store: 'homedepot', sku: '81304', category: 'Pavers', inStock: true },
  { id: "lw-111", name: 'Belgard 12x12 Patio Stone', brand: 'Belgard', price: 2.18, contractorPrice: 1.89, unit: 'each', store: 'lowes', sku: 'BG1212', category: 'Pavers', inStock: true },
  { id: "lw-112", name: 'Versa-Lok Standard Retaining Wall Block', brand: 'Versa-Lok', price: 3.28, contractorPrice: 2.85, unit: 'each', store: 'lowes', sku: 'VL-STD', category: 'Pavers', inStock: true },
  { id: "hd-114", name: 'Dimex EasyFlex Landscape Edging 20ft', brand: 'Dimex', price: 19.97, contractorPrice: 17.25, unit: 'roll', store: 'homedepot', sku: '3600-20C', category: 'Edging', inStock: true },
  { id: "lw-113", name: 'Suncast Borden Landscape Edging 20ft', brand: 'Suncast', price: 17.98, contractorPrice: 15.50, unit: 'roll', store: 'lowes', sku: 'SC20LE', category: 'Edging', inStock: true },
  // Landscaping — Fertilizer & Weed Control
  { id: "hd-115", name: 'Scotts Turf Builder Lawn Food 12.5lb', brand: 'Scotts', price: 29.97, contractorPrice: 25.99, unit: 'bag', store: 'homedepot', sku: '23008', category: 'Fertilizer', inStock: true },
  { id: "lw-115", name: 'Miracle-Gro Water Soluble All Purpose Plant Food 5lb', brand: 'Miracle-Gro', price: 23.98, contractorPrice: 20.75, unit: 'bag', store: 'lowes', sku: 'MG5APF', category: 'Fertilizer', inStock: true },
  { id: "hd-116", name: 'Roundup Ready-To-Use Weed Killer 1 gal', brand: 'Roundup', price: 19.97, contractorPrice: 17.25, unit: 'jug', store: 'homedepot', sku: '5003510', category: 'Weed Control', inStock: true },
  { id: "lw-116", name: 'Ortho GroundClear Weed & Grass Killer 1 gal', brand: 'Ortho', price: 21.98, contractorPrice: 19.00, unit: 'jug', store: 'lowes', sku: 'OR1GC', category: 'Weed Control', inStock: true },
  // Landscaping — Irrigation
  { id: "hd-120", name: 'Rain Bird 1/2" Pop-Up Sprinkler Head', brand: 'Rain Bird', price: 3.98, contractorPrice: 3.45, unit: 'each', store: 'homedepot', sku: '1804VAN', category: 'Irrigation', inStock: true },
  { id: "hd-121", name: 'Rain Bird 1/2" Drip Irrigation Kit 50ft', brand: 'Rain Bird', price: 29.97, contractorPrice: 25.99, unit: 'kit', store: 'homedepot', sku: 'DRIPPAILQ', category: 'Irrigation', inStock: true },
  { id: "lw-120", name: 'Orbit 1/2" 90-Degree Drip Emitter', brand: 'Orbit', price: 1.48, contractorPrice: 1.28, unit: 'each', store: 'lowes', sku: 'OR90DE', category: 'Irrigation', inStock: true },
  { id: "lw-121", name: 'Hunter 1/2" Pop-Up Spray Sprinkler', brand: 'Hunter', price: 4.78, contractorPrice: 4.15, unit: 'each', store: 'lowes', sku: 'HU12PS', category: 'Irrigation', inStock: true },
  // Fencing
  { id: "hd-130", name: '4x4x8 Pressure Treated Post', brand: 'WeatherShield', price: 12.97, contractorPrice: 11.25, unit: 'each', store: 'homedepot', sku: '246285', category: 'Fencing', inStock: true },
  { id: "hd-131", name: '6ft Cedar Privacy Fence Board', brand: 'Cedar', price: 7.87, contractorPrice: 6.85, unit: 'each', store: 'homedepot', sku: '161662', category: 'Fencing', inStock: true },
  { id: "lw-130", name: '8ft Pressure Treated 4x4 Post', brand: 'WeatherShield', price: 14.28, contractorPrice: 12.40, unit: 'each', store: 'lowes', sku: 'WS448PT', category: 'Fencing', inStock: true },
  { id: "lw-131", name: 'Wooden Fence Picket 1x3x6', brand: 'Lumber', price: 2.78, contractorPrice: 2.40, unit: 'each', store: 'lowes', sku: 'WP1X36', category: 'Fencing', inStock: true },
  // Roofing
  { id: "hd-100", name: 'Owens Corning Architectural Shingles', brand: 'Owens Corning', price: 109.00, contractorPrice: 95.00, unit: 'bundle', store: 'homedepot', sku: '516808', category: 'Roofing', inStock: true },
  { id: "lw-100", name: 'GAF Timberline HDZ Shingles', brand: 'GAF', price: 114.98, contractorPrice: 99.50, unit: 'bundle', store: 'lowes', sku: 'GAF-THDZ', category: 'Roofing', inStock: true },
  { id: "hd-101", name: 'Felt Paper 30lb 4 sq', brand: 'Anchor', price: 29.97, contractorPrice: 26.50, unit: 'roll', store: 'homedepot', sku: '202855', category: 'Roofing', inStock: true },
  // Decking
  { id: "hd-110", name: '5/4x6x8 Pressure Treated Deck Board', brand: 'WeatherShield', price: 9.47, contractorPrice: 8.25, unit: 'each', store: 'homedepot', sku: '491741', category: 'Decking', inStock: true },
  { id: "lw-110", name: 'TimberTech Composite Deck Board 12ft', brand: 'TimberTech', price: 28.78, contractorPrice: 25.20, unit: 'each', store: 'lowes', sku: 'TT12CB', category: 'Decking', inStock: true },
];

router.get("/products/search", (req: Request, res: Response) => {
  const q = (req.query["q"] as string || "").toLowerCase().trim();
  const store = (req.query["store"] as string || "all");

  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  let results = MOCK_PRODUCTS.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q);
    const matchesStore = store === "all" || p.store === store;
    return matchesQuery && matchesStore;
  });

  return res.json({
    products: results,
    query: q,
    total: results.length,
  });
});

export default router;
