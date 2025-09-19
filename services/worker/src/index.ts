import 'dotenv/config';
import { validateEnv } from '@coloringpage/config';
import { createSupabaseAdminClient } from '@coloringpage/database';
import PgBoss from 'pg-boss';
import { setupIngestWorker } from './ingest';
import { setupGenerationWorker } from './generate';
import { setupPDFWorker } from './pdf';

async function main() {
  try {
    // Validate environment variables
    const env = validateEnv(process.env);
    console.log('✅ Environment variables validated');

    // Initialize Supabase admin client
    const supabase = createSupabaseAdminClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY!
    );
    console.log('✅ Supabase client initialized');

    // Initialize job queue
    const boss = new PgBoss({
      connectionString: `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/postgres_fdw_handler`,
      retryLimit: 2,
      retryDelay: 1000,
      expireInHours: 1,
    });

    await boss.start();
    console.log('✅ Job queue started');

    // Set up workers
    await setupIngestWorker(boss, supabase);
    await setupGenerationWorker(boss, supabase);
    await setupPDFWorker(boss, supabase);

    console.log('🚀 All workers are running');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('🛑 Shutting down workers...');
      await boss.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start worker service:', error);
    process.exit(1);
  }
}

main();