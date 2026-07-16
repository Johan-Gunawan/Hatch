import { industries } from "../schema/industries.js";
import type { Industry } from "../schema/industries.js";
import { employmentTypes, jobCategories, workArrangements } from "../schema/jobs.js";
import type {
  EmploymentTypeModel,
  JobCategoryModel,
  WorkArrangementModel,
} from "../schema/jobs.js";
import type { DrizzleDB } from "./types.js";

export class LookupRepository {
  constructor(private readonly db: DrizzleDB) {}

  async findAllEmploymentTypes(): Promise<EmploymentTypeModel[]> {
    return this.db.select().from(employmentTypes);
  }

  async findAllWorkArrangements(): Promise<WorkArrangementModel[]> {
    return this.db.select().from(workArrangements);
  }

  async findAllJobCategories(): Promise<JobCategoryModel[]> {
    return this.db.select().from(jobCategories);
  }

  async findAllIndustries(): Promise<Industry[]> {
    return this.db.select().from(industries);
  }
}
