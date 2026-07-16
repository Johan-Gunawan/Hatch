import { desc, eq } from "drizzle-orm";
import { resumeMatches, resumes } from "../schema/resumes.js";
import type { ResumeModel, ResumeProfile } from "../schema/resumes.js";
import type { DrizzleDB } from "./types.js";

export interface CreateResumeInput {
  fileName: string | null;
  rawText: string;
  profile: ResumeProfile;
  embedding: number[];
  weakMatch: boolean;
}

export interface ResumeMatchInput {
  jobId: string;
  score: number;
  rank: number;
}

export class ResumeRepository {
  constructor(private readonly db: DrizzleDB) {}

  async create(data: CreateResumeInput): Promise<string> {
    console.log(
      "resume-repo.create",
      JSON.stringify({ fileName: data.fileName, weakMatch: data.weakMatch })
    );
    const [row] = await this.db
      .insert(resumes)
      .values({
        fileName: data.fileName,
        rawText: data.rawText,
        profile: data.profile,
        embedding: data.embedding,
        weakMatch: data.weakMatch,
      })
      .returning({ id: resumes.id });
    return row.id;
  }

  async saveMatches(resumeId: string, rows: ResumeMatchInput[]): Promise<void> {
    console.log("resume-repo.saveMatches", JSON.stringify({ resumeId, count: rows.length }));
    if (rows.length === 0) return;
    await this.db
      .insert(resumeMatches)
      .values(rows.map((r) => ({ resumeId, jobId: r.jobId, score: r.score, rank: r.rank })));
  }

  async findById(id: string): Promise<ResumeModel | null> {
    const [row] = await this.db.select().from(resumes).where(eq(resumes.id, id)).limit(1);
    return row ?? null;
  }

  async list(limit = 50): Promise<ResumeModel[]> {
    return this.db.select().from(resumes).orderBy(desc(resumes.createdAt)).limit(limit);
  }
}
