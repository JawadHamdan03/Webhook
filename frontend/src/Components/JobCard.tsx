import type { Job } from '../lib/api'

type JobCardProps = {
    job: Job
}

export const JobCard = ({ job }: JobCardProps) => {
    return (
        <article className="rounded-3xl border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm text-slate-500">{job.id}</span>
                <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-teal-700">
                    {job.status}
                </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">Pipeline ID: {job.pipelineId}</p>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-100 p-4 text-xs leading-6 text-slate-700">
                <code>{JSON.stringify(job.payload, null, 2)}</code>
            </pre>
        </article>
    )
}