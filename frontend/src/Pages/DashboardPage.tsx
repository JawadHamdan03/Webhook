import { type Job, type Pipeline } from '../lib/api'
import { InfoCard } from '../Components/InfoCard'
import { JobCard } from '../Components/JobCard'
import { PipelineCard } from '../Components/PipelineCard'
import { PipelineForm, type PipelineFormData } from '../Components/PipelineForm'

type DashboardPageProps = {
    error: string | null
    isLoadingData: boolean
    jobs: Job[]
    jobsByStatus: Record<string, number>
    onLogout: () => void
    pipelines: Pipeline[]
    onCreatePipeline: (data: PipelineFormData) => Promise<void>
    onUpdatePipeline: (data: PipelineFormData) => Promise<void>
    onDeletePipeline: (id: string) => Promise<void>
    onOpenCreateModal: () => void
    onOpenEditModal: (pipeline: Pipeline) => void
    onCloseModal: () => void
    showPipelineModal: boolean
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
    pipelines,
    onCreatePipeline,
    onUpdatePipeline,
    onDeletePipeline,
    onOpenCreateModal,
    onOpenEditModal,
    onCloseModal,
    showPipelineModal,
    editingPipeline,
    pipelineError,
    isPipelineSubmitting
}: DashboardPageProps) => {
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
                            <h2 className="text-2xl font-semibold">Recent jobs</h2>

                            <div className="mt-6 space-y-4">
                                {jobs.slice(0, 8).map((job) => (
                                    <JobCard key={job.id} job={job} />
                                ))}

                                {!isLoadingData && jobs.length === 0 ? (
                                    <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                                        No jobs returned by the backend.
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