import { useState } from 'react'
import type { Job, Pipeline } from '../lib/api'

type WebhookTesterProps = {
    createdJobId: string | null
    createdJobStatus: Job['status'] | null
    error: string | null
    isPollingCreatedJob: boolean
    isSubmitting: boolean
    onSubmit: (sourceKey: string, payload: Record<string, unknown>) => Promise<void>
    onViewCreatedJob: (jobId: string) => void
    pipelines: Pipeline[]
    success: string | null
}

const defaultPayload = `{
  "event": "invoice.created",
  "customerId": "cus_12345",
  "amount": 1499,
  "currency": "USD"
}`

const formatStatusLabel = (status: Job['status'] | null) => {
    if (!status) {
        return 'Unknown'
    }

    return status.charAt(0).toUpperCase() + status.slice(1)
}

export const WebhookTester = ({
    createdJobId,
    createdJobStatus,
    error,
    isPollingCreatedJob,
    isSubmitting,
    onSubmit,
    onViewCreatedJob,
    pipelines,
    success
}: WebhookTesterProps) => {
    const [selectedSourceKey, setSelectedSourceKey] = useState('')
    const [payloadText, setPayloadText] = useState(defaultPayload)
    const [localError, setLocalError] = useState<string | null>(null)
    const effectiveSourceKey = selectedSourceKey || pipelines[0]?.sourceKey || ''

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLocalError(null)

        if (!effectiveSourceKey) {
            setLocalError('Choose a pipeline source key before sending a test webhook.')
            return
        }

        try {
            const parsed = JSON.parse(payloadText) as unknown

            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                setLocalError('Webhook payload must be a JSON object.')
                return
            }

            await onSubmit(effectiveSourceKey, parsed as Record<string, unknown>)
        } catch {
            setLocalError('Webhook payload must be valid JSON.')
        }
    }

    return (
        <section className="rounded-4xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">Send test webhook</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Post a sample payload to a pipeline source key and create a job instantly.
                    </p>
                </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                    <span className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                        Pipeline source key
                    </span>
                    <select
                        value={effectiveSourceKey}
                        onChange={(event) => setSelectedSourceKey(event.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                        disabled={isSubmitting || pipelines.length === 0}
                    >
                        {pipelines.length === 0 ? <option value="">No pipelines available</option> : null}
                        {pipelines.map((pipeline) => (
                            <option key={pipeline.id} value={pipeline.sourceKey}>
                                {pipeline.name} ({pipeline.sourceKey})
                            </option>
                        ))}
                    </select>
                </label>

                <label className="block">
                    <span className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                        JSON payload
                    </span>
                    <textarea
                        value={payloadText}
                        onChange={(event) => setPayloadText(event.target.value)}
                        rows={10}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-emerald-200 outline-none transition focus:border-slate-500"
                        spellCheck={false}
                        disabled={isSubmitting}
                    />
                </label>

                {localError ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {localError}
                    </div>
                ) : null}

                {error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </div>
                ) : null}

                {success ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        <p>{success}</p>
                        {createdJobId ? (
                            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-emerald-800">
                                    <span className="rounded-full bg-white/80 px-3 py-1">
                                        Job {createdJobId}
                                    </span>
                                    <span className="rounded-full bg-white/80 px-3 py-1">
                                        Status {formatStatusLabel(createdJobStatus)}
                                    </span>
                                    {isPollingCreatedJob ? (
                                        <span className="rounded-full bg-white/80 px-3 py-1">
                                            Refreshing live
                                        </span>
                                    ) : null}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onViewCreatedJob(createdJobId)}
                                    className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-white"
                                >
                                    View created job
                                </button>
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || pipelines.length === 0}
                        className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {isSubmitting ? 'Sending...' : 'Send webhook'}
                    </button>
                </div>
            </form>
        </section>
    )
}