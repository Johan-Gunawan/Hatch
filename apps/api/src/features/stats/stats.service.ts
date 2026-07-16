import { companyRepo, jobRepo } from "@repo/db";

export const statsService = {
  get: async () => {
    const [companies, locations, activeJobs] = await Promise.all([
      companyRepo.count(),
      jobRepo.countActiveLocations(),
      jobRepo.countActive(),
    ]);
    console.log("stats-service.get", JSON.stringify({ companies, locations, activeJobs }));
    return { companies, locations, activeJobs };
  },
};
