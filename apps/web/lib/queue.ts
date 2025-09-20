import PgBoss from 'pg-boss';

let boss: PgBoss | null = null;

export async function getJobQueue(): Promise<PgBoss> {
  if (boss) {
    return boss;
  }

  // Create pg-boss connection using Supabase PostgreSQL connection
  // Get database host from Supabase project (htxsylxwvcbrazdowjys in eu-north-1)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Extract the project ID from the Supabase URL
  const projectId = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

  // Construct PostgreSQL connection string for Supabase pooler (eu-north-1 region)
  const connectionString = `postgresql://postgres.${projectId}:${serviceRoleKey}@aws-0-eu-north-1.pooler.supabase.com:6543/postgres`;

  boss = new PgBoss({
    connectionString,
    retryLimit: 2,
    retryDelay: 1000,
    expireInHours: 1,
    newJobCheckInterval: 2000,
    archiveCompletedAfterSeconds: 24 * 60 * 60, // 24 hours
  });

  await boss.start();

  return boss;
}

// Job data interface for generation jobs
export interface GenerationJobData {
  job_id: string;
  user_id: string;
  asset_id: string;
  params: {
    complexity: 'simple' | 'standard' | 'detailed';
    line_thickness: 'thin' | 'medium' | 'thick';
    custom_prompt?: string;
  };
}

export async function enqueueGenerationJob(data: GenerationJobData): Promise<string | null> {
  const queue = await getJobQueue();

  // Create idempotency key to prevent duplicate jobs
  const idempotencyKey = `${data.userId}-${data.assetId}-${JSON.stringify(data.params)}`;

  const jobId = await queue.send('image-generation', data, {
    singletonKey: idempotencyKey, // Prevents duplicate jobs
    expireInHours: 1,
    retryLimit: 2,
    retryBackoff: true,
    retryDelay: 1000
  });

  return jobId;
}