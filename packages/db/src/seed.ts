import { db } from "./db.js";
import {
  districts,
  employmentTypes,
  jobCategories,
  industries,
  provinces,
  workArrangements,
} from "./schema/index.js";

interface WilayahProvince {
  code: string;
  name: string;
}

interface WilayahRegency {
  code: string;
  name: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const json = (await res.json()) as { data: T };
  return json.data;
}

function resolveDistrictType(name: string): "kabupaten" | "kota" {
  if (name.toLowerCase().startsWith("kabupaten")) return "kabupaten";
  return "kota";
}

async function seedGeographic() {
  console.log("Fetching provinces from wilayah.id...");
  const apiProvinces = await fetchJson<WilayahProvince[]>("https://wilayah.id/api/provinces.json");

  await db
    .insert(provinces)
    .values(apiProvinces.map((p) => ({ name: p.name, code: p.code })))
    .onConflictDoNothing();
  console.log(`  Inserted ${apiProvinces.length} provinces.`);

  const existingProvinces = await db.select().from(provinces);
  const provinceByCode = new Map(existingProvinces.map((p) => [p.code, p]));

  const existingDistricts = await db.select({ id: districts.id }).from(districts).limit(1);
  if (existingDistricts.length > 0) {
    console.log("Districts already seeded, skipping.");
    return;
  }

  console.log("Fetching regencies for each province...");
  for (const apiProvince of apiProvinces) {
    const province = provinceByCode.get(apiProvince.code);
    if (!province) continue;

    const regencies = await fetchJson<WilayahRegency[]>(
      `https://wilayah.id/api/regencies/${apiProvince.code}.json`
    );

    if (regencies.length > 0) {
      await db.insert(districts).values(
        regencies.map((r) => ({
          provinceId: province.id,
          name: r.name,
          type: resolveDistrictType(r.name),
          code: r.code,
        }))
      );
    }

    process.stdout.write(`  ${apiProvince.name}: ${regencies.length} regencies\n`);
    await new Promise((r) => setTimeout(r, 100));
  }
}

async function seed() {
  console.log("Seeding employment_types...");
  await db
    .insert(employmentTypes)
    .values([
      { name: "Full Time", slug: "full_time" },
      { name: "Part Time", slug: "part_time" },
      { name: "Contract", slug: "contract" },
      { name: "Freelance", slug: "freelance" },
      { name: "Internship", slug: "internship" },
    ])
    .onConflictDoNothing();

  console.log("Seeding work_arrangements...");
  await db
    .insert(workArrangements)
    .values([
      { name: "Onsite", slug: "onsite" },
      { name: "Hybrid", slug: "hybrid" },
      { name: "Remote", slug: "remote" },
    ])
    .onConflictDoNothing();

  console.log("Seeding job_categories...");
  await db
    .insert(jobCategories)
    .values([
      { name: "Engineering", slug: "engineering" },
      { name: "Product", slug: "product" },
      { name: "Design", slug: "design" },
      { name: "Marketing", slug: "marketing" },
      { name: "Sales", slug: "sales" },
      { name: "Finance", slug: "finance" },
      { name: "Human Resources", slug: "hr" },
      { name: "Operations", slug: "operations" },
      { name: "Legal", slug: "legal" },
      { name: "Data & Analytics", slug: "data-analytics" },
      { name: "Customer Service", slug: "customer-service" },
    ])
    .onConflictDoNothing();

  console.log("Seeding industries...");
  await db
    .insert(industries)
    .values([
      { name: "Technology", slug: "technology" },
      { name: "E-commerce", slug: "e-commerce" },
      { name: "Financial Services", slug: "financial-services" },
      { name: "Healthcare", slug: "healthcare" },
      { name: "Education", slug: "education" },
      { name: "Logistics & Supply Chain", slug: "logistics" },
      { name: "Media & Entertainment", slug: "media-entertainment" },
      { name: "Retail", slug: "retail" },
      { name: "Manufacturing", slug: "manufacturing" },
      { name: "Consulting", slug: "consulting" },
      { name: "Telecommunications", slug: "telecommunications" },
      { name: "Real Estate", slug: "real-estate" },
    ])
    .onConflictDoNothing();

  await seedGeographic();

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
