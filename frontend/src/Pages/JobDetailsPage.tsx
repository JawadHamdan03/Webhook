import type { DeliveryAttempt, Job, Pipeline } from '../lib/api'
import { InfoCard } from '../Components/InfoCard'

type JobDetailsPageProps = {
    deliveries: DeliveryAttempt[]
    error: string | null
    isLoading: boolean
    job: Job | null
    onBack: () => void
    pipeline: Pipeline | null
}

const formatDate = (value?: string | null) => {
    if (!value) {
        return 'Not available'
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const renderJson = (value: unknown) => {
    if (value === null || value === undefined) {
        return 'No data available.'
    }

    return JSON.stringify(value, null, 2)
}

export const JobDetailsPage = ({ deliveries, error, isLoading, job, onBack, pipeline }: JobDetailsPageProps) => {
    return (
        <div className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
            <div className="mx-auto max-w-7xl space-y-8">
                <header className="flex flex-col gap-4 rounded-4xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <button
                            type="button"
                            onClick={onBack}
                            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                        >
                            Back to dashboard
                        </button>
                        <h1 className="mt-4 text-3xl font-semibold">Job details</h1>
                        <p className="mt-2 font-mono text-sm text-slate-500">{job?.id ?? 'Loading job id...'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="rounded-full bg-teal-100 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-teal-700">
                            {job?.status ?? 'loading'}
                        </span>
                    </div>
                </header>

                {error ? (
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
                        {error}
                    </div>
                ) : null}

                <section className="grid gap-4 md:grid-cols-4">
                    <InfoCard
                        title="Pipeline"
                        value={pipeline?.name ?? job?.pipelineId ?? 'Unknown'}
                        description="Pipeline handling this job"
                    />
                    <InfoCard
                        title="Attempts"
                        value={String(job?.attemptCount ?? deliveries.length)}
                        description="Worker processing attempts"
                    />
                    <InfoCard
                        title="Deliveries"
                        value={String(deliveries.length)}
                        description="Subscriber delivery records"
                    />
                    <InfoCard
                        title="Processed"
                        value={job?.processedAt ? 'Yes' : 'No'}
                        description="Whether the worker finished processing"
                    />
                </section>

                {isLoading ? (
                    <section className="rounded-4xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-slate-500">Loading job details...</p>
                    </section>
                ) : null}

                {!isLoading && job ? (
                    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                        <section className="space-y-8">
                            <div className="rounded-4xl bg-white p-6 shadow-sm">
                                <h2 className="text-2xl font-semibold">Payload</h2>
                                <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-emerald-200">
                                    <code>{renderJson(job.payload)}</code>
                                </pre>
                            </div>

                            <div className="rounded-4xl bg-white p-6 shadow-sm">
                                <h2 className="text-2xl font-semibold">Processed output</h2>
                                <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-100 p-4 text-xs leading-6 text-slate-700">
                                    <code>{renderJson(job.processedOutput)}</code>
                                </pre>
                            </div>

                            <div className="rounded-4xl bg-white p-6 shadow-sm">
                                <h2 className="text-2xl font-semibold">Delivery attempts</h2>
                                <div className="mt-6 space-y-4">
                                    {deliveries.length === 0 ? (
                                        <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                                            No delivery attempts recorded for this job.
                                        </div>
                                    ) : (
                                        deliveries.map((delivery) => (
                                            <article key={delivery.id} className="rounded-3xl border border-slate-200 p-5">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <h3 className="text-lg font-semibold">Attempt {delivery.attemptNumber}</h3>
                                                        <p className="mt-1 font-mono text-xs text-slate-500">Subscriber {delivery.subscriberId}</p>
                                                    </div>
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                                                        {delivery.status}
                                                    </span>
                                                </div>
                                                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                                                    <p>HTTP status: {delivery.responseStatus ?? 'N/A'}</p>
                                                    <p>Retry at: {formatDate(delivery.nextRetryAt)}</p>
                                                    <p>Created: {formatDate(delivery.createdAt)}</p>
                                                    <p>Updated: {formatDate(delivery.updatedAt)}</p>
                                                </div>
                                                {delivery.errorMessage ? (
                                                    <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                                        {delivery.errorMessage}
                                                    </div>
                                                ) : null}
                                                {delivery.responseBody ? (
                                                    <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-100 p-4 text-xs leading-6 text-slate-700">
                                                        <code>{delivery.responseBody}</code>
                                                    </pre>
                                                ) : null}
                                            </article>
                                        ))
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <div className="rounded-4xl bg-white p-6 shadow-sm">
                                <h2 className="text-2xl font-semibold">Metadata</h2>
                                <dl className="mt-6 space-y-4 text-sm text-slate-600">
                                    <div>
                                        <dt className="font-medium text-slate-900">Pipeline ID</dt>
                                        <dd className="mt-1 font-mono text-xs">{job.pipelineId}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium text-slate-900">Created</dt>
                                        <dd className="mt-1">{formatDate(job.createdAt)}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium text-slate-900">Updated</dt>
                                        <dd className="mt-1">{formatDate(job.updatedAt)}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium text-slate-900">Processed</dt>
                                        <dd className="mt-1">{formatDate(job.processedAt)}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="rounded-4xl bg-white p-6 shadow-sm">
                                <h2 className="text-2xl font-semibold">Pipeline config</h2>
                                {pipeline ? (
                                    <>
                                        <div className="mt-4 flex flex-wrap items-center gap-3">
                                            <h3 className="text-lg font-semibold">{pipeline.name}</h3>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                                                {pipeline.actionType}
                                            </span>
                                        </div>
                                        <p className="mt-2 font-mono text-xs text-slate-500">{pipeline.sourceKey}</p>
                                        <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-emerald-200">
                                            <code>{renderJson(pipeline.actionConfig)}</code>
                                        </pre>
                                    </>
                                ) : (
                                    <p className="mt-4 text-sm text-slate-500">Pipeline metadata is not available in the current session.</p>
                                )}
                            </div>

                            <div className="rounded-4xl bg-white p-6 shadow-sm">
                                <h2 className="text-2xl font-semibold">Processing error</h2>
                                {job.errorMessage ? (
                                    <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        {job.errorMessage}
                                    </div>
                                ) : (
                                    <p className="mt-4 text-sm text-slate-500">No processing error recorded for this job.</p>
                                )}
                            </div>
                        </section>
                    </div>
                ) : null}

                {!isLoading && !job && !error ? (
                    <section className="rounded-4xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-slate-500">The selected job could not be loaded.</p>
                    </section>
                ) : null}
            </div>
        </div>
    )
}