import { useDeferredValue, useState } from 'react'
import { type Job, type Pipeline } from '../lib/api'
import { InfoCard } from '../Components/InfoCard'
import { JobCard } from '../Components/JobCard'
import { PipelineCard } from '../Components/PipelineCard'
import { PipelineForm, type PipelineFormData } from '../Components/PipelineForm'
import { WebhookTester } from '../Components/WebhookTester'

type DashboardPageProps = {
    error: string | null
    isLoadingData: boolean
    jobs: Job[]
    jobsByStatus: Record<string, number>
    onLogout: () => void
    onOpenJobDetails: (jobId: string) => void
    pipelines: Pipeline[]
    onSendWebhookTest: (sourceKey: string, payload: Record<string, unknown>) => Promise<void>
    onCreatePipeline: (data: PipelineFormData) => Promise<void>
    onUpdatePipeline: (data: PipelineFormData) => Promise<void>
    onDeletePipeline: (id: string) => Promise<void>
    onOpenCreateModal: () => void
    onOpenEditModal: (pipeline: Pipeline) => void
    onCloseModal: () => void
    showPipelineModal: boolean
    webhookTestError: string | null
    webhookTestSuccess: string | null
    isSendingWebhookTest: boolean
    editingPipeline: Pipeline | null
    pipelineError: string | null
    isPipelineSubmitting: boolean
}

export const DashboardPage = ({
    error,
    isLoadingData,
    jobs,
    jobsByStatus,
    onLogout,
    onOpenJobDetails,
    pipelines,
    onSendWebhookTest,
    onCreatePipeline,
    onUpdatePipeline,
    onDeletePipeline,
    onOpenCreateModal,
    onOpenEditModal,
    onCloseModal,
    showPipelineModal,
    webhookTestError,
    webhookTestSuccess,
    isSendingWebhookTest,
    editingPipeline,
    pipelineError,
    isPipelineSubmitting
}: DashboardPageProps) => {
    const [jobSearch, setJobSearch] = useState('')
    const [jobStatusFilter, setJobStatusFilter] = useState<'all' | Job['status']>('all')
    const [jobPipelineFilter, setJobPipelineFilter] = useState<'all' | string>('all')

    const deferredJobSearch = useDeferredValue(jobSearch.trim().toLowerCase())

    const filteredJobs = jobs.filter((job) => {
        const matchesStatus = jobStatusFilter === 'all' || job.status === jobStatusFilter
        const matchesPipeline = jobPipelineFilter === 'all' || job.pipelineId === jobPipelineFilter

        if (!matchesStatus || !matchesPipeline) {
            return false
        }

        if (!deferredJobSearch) {
            return true
        }

        const searchableText = [
            job.id,
            job.pipelineId,
            job.status,
            job.errorMessage ?? '',
            JSON.stringify(job.payload),
            JSON.stringify(job.processedOutput ?? {})
        ]
            .join(' ')
            .toLowerCase()

        return searchableText.includes(deferredJobSearch)
    })

    const hasActiveJobFilters = deferredJobSearch.length > 0 || jobStatusFilter !== 'all' || jobPipelineFilter !== 'all'

    return (
        <>
            <div className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
                <div className="mx-auto max-w-7xl space-y-8">
                    <header className="flex flex-col gap-5 rounded-4xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div>

                            <h1 className="mt-2 text-3xl font-semibold">Webhook Dashboard</h1>

                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white" onClick={onLogout}>
                                Logout
                            </button>
                        </div>
                    </header>

                    {error ? (
                        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
                            {error}
                        </div>
                    ) : null}

                    <section className="grid gap-4 md:grid-cols-4">
                        <InfoCard title="Pipelines" value={String(pipelines.length)} description="Protected records from GET /pipelines" />
                        <InfoCard title="Jobs" value={String(jobs.length)} description="Public records from GET /jobs" />
                        <InfoCard title="Completed" value={String(jobsByStatus.completed ?? 0)} description="Jobs marked completed" />
                        <InfoCard title="Pending" value={String(jobsByStatus.pending ?? 0)} description="Jobs waiting on worker progress" />
                    </section>

                    <WebhookTester
                        error={webhookTestError}
                        isSubmitting={isSendingWebhookTest}
                        onSubmit={onSendWebhookTest}
                        pipelines={pipelines}
                        success={webhookTestSuccess}
                    />

                    <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
                        <section className="rounded-4xl bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-2xl font-semibold">Pipelines</h2>
                                </div>
                                <button
                                    onClick={onOpenCreateModal}
                                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    New Pipeline
                                </button>
                            </div>

                            <div className="mt-6 space-y-4">
                                {pipelines.map((pipeline) => (
                                    <div key={pipeline.id} className="flex gap-2">
                                        <div className="flex-1">
                                            <PipelineCard pipeline={pipeline} />
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => onOpenEditModal(pipeline)}
                                                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onDeletePipeline(pipeline.id)}
                                                className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {!isLoadingData && pipelines.length === 0 ? (
                                    <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                                        No pipelines returned by the backend.
                                    </div>
                                ) : null}
                            </div>
                        </section>

                        <section className="rounded-4xl bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-semibold">Jobs</h2>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Showing {filteredJobs.length} of {jobs.length} jobs
                                    </p>
                                </div>

                                {hasActiveJobFilters ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setJobSearch('')
                                            setJobStatusFilter('all')
                                            setJobPipelineFilter('all')
                                        }}
                                        className="rounded-full border border-slate-300 px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-700"
                                    >
                                        Clear filters
                                    </button>
                                ) : null}
                            </div>

                            <div className="mt-6 grid gap-3 md:grid-cols-[1.4fr_0.8fr_1fr]">
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                                        Search
                                    </span>
                                    <input
                                        type="search"
                                        value={jobSearch}
                                        onChange={(event) => setJobSearch(event.target.value)}
                                        placeholder="Search by job id, payload, status, or error"
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                                        Status
                                    </span>
                                    <select
                                        value={jobStatusFilter}
                                        onChange={(event) => setJobStatusFilter(event.target.value as 'all' | Job['status'])}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                                    >
                                        <option value="all">All statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="completed">Completed</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                                        Pipeline
                                    </span>
                                    <select
                                        value={jobPipelineFilter}
                                        onChange={(event) => setJobPipelineFilter(event.target.value)}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                                    >
                                        <option value="all">All pipelines</option>
                                        {pipelines.map((pipeline) => (
                                            <option key={pipeline.id} value={pipeline.id}>
                                                {pipeline.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="mt-6 space-y-4">
                                {filteredJobs.map((job) => (
                                    <JobCard key={job.id} job={job} onSelect={onOpenJobDetails} />
                                ))}

                                {!isLoadingData && jobs.length === 0 ? (
                                    <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                                        No jobs returned by the backend.
                                    </div>
                                ) : null}

                                {!isLoadingData && jobs.length > 0 && filteredJobs.length === 0 ? (
                                    <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                                        No jobs match the current search and filters.
                                    </div>
                                ) : null}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* Pipeline Modal */}
            {showPipelineModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-4xl p-6 w-full max-w-lg shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4">
                            {editingPipeline ? 'Edit Pipeline' : 'Create Pipeline'}
                        </h2>
                        <PipelineForm
                            initialData={editingPipeline || undefined}
                            onSubmit={editingPipeline ? onUpdatePipeline : onCreatePipeline}
                            onCancel={onCloseModal}
                            isLoading={isPipelineSubmitting}
                            error={pipelineError}
                        />
                    </div>
                </div>
            )}
        </>
    )
}