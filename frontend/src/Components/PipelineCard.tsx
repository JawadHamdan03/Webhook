import type { Pipeline, Subscriber } from '../lib/api'
import { SubscriberManager } from './SubscriberManager'

type PipelineCardProps = {
    isSubscriberSubmitting: boolean
    onCreateSubscriber: (targetUrl: string) => Promise<void>
    onDeleteSubscriber: (subscriberId: string) => Promise<void>
    onUpdateSubscriber: (subscriberId: string, targetUrl: string) => Promise<void>
    pipeline: Pipeline
    subscribers: Subscriber[]
}

export const PipelineCard = ({
    isSubscriberSubmitting,
    onCreateSubscriber,
    onDeleteSubscriber,
    onUpdateSubscriber,
    pipeline,
    subscribers
}: PipelineCardProps) => {
    return (
        <article className="rounded-3xl border border-slate-200 p-5">
            <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-semibold">{pipeline.name}</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                    {pipeline.actionType}
                </span>
            </div>
            <p className="mt-3 font-mono text-sm text-slate-500">{pipeline.sourceKey}</p>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-emerald-200">
                <code>{JSON.stringify(pipeline.actionConfig, null, 2)}</code>
            </pre>
            <SubscriberManager
                isSubmitting={isSubscriberSubmitting}
                onCreateSubscriber={onCreateSubscriber}
                onDeleteSubscriber={onDeleteSubscriber}
                onUpdateSubscriber={onUpdateSubscriber}
                subscribers={subscribers}
            />
        </article>
    )
}