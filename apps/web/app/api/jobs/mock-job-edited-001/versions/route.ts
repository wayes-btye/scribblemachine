import { NextResponse } from 'next/server'

export async function GET() {
  const mockVersions = {
    total_versions: 2,
    original_job_id: 'mock-job-original-001',
    requested_job_id: 'mock-job-edited-001',
    versions: [
      {
        id: 'mock-job-original-001',
        status: 'succeeded',
        params_json: {
          complexity: 'simple',
          line_thickness: 'medium'
        },
        cost_cents: 100,
        model: 'gemini-1.5-flash',
        started_at: new Date(Date.now() - 300000).toISOString(),
        ended_at: new Date(Date.now() - 294000).toISOString(),
        created_at: new Date(Date.now() - 300000).toISOString(),
        updated_at: new Date(Date.now() - 294000).toISOString(),
        download_urls: {
          edge_map: '/assets/chicken-eating-a-frog.png',
          pdf: '/assets/chicken-eating-a-frog.png'
        },
        version_type: 'original',
        version_order: 0
      },
      {
        id: 'mock-job-edited-001',
        status: 'succeeded',
        params_json: {
          complexity: 'simple',
          line_thickness: 'medium',
          edit_parent_id: 'mock-job-original-001',
          edit_prompt: 'Make it more detailed with additional characters'
        },
        cost_cents: 100,
        model: 'gemini-1.5-flash',
        started_at: new Date(Date.now() - 60000).toISOString(),
        ended_at: new Date(Date.now() - 54000).toISOString(),
        created_at: new Date(Date.now() - 60000).toISOString(),
        updated_at: new Date(Date.now() - 54000).toISOString(),
        download_urls: {
          edge_map: '/assets/peppa-and-chase-holding-hands.png',
          pdf: '/assets/peppa-and-chase-holding-hands.png'
        },
        version_type: 'edit',
        edit_prompt: 'Make it more detailed with additional characters',
        version_order: 1
      }
    ],
    metadata: {
      has_edits: true,
      edit_count: 1,
      max_edits: 2
    }
  }

  return NextResponse.json(mockVersions)
}
