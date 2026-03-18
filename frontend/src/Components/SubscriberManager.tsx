import { useState } from 'react'
import type { Subscriber } from '../lib/api'

type SubscriberManagerProps = {
    isSubmitting: boolean
    onCreateSubscriber: (targetUrl: string) => Promise<void>
    onDeleteSubscriber: (subscriberId: string) => Promise<void>
    onUpdateSubscriber: (subscriberId: string, targetUrl: string) => Promise<void>
    subscribers: Subscriber[]
}

export const SubscriberManager = ({
    isSubmitting,
    onCreateSubscriber,
    onDeleteSubscriber,
    onUpdateSubscriber,
    subscribers
}: SubscriberManagerProps) => {
    const [newUrl, setNewUrl] = useState('')
    const [editingSubscriberId, setEditingSubscriberId] = useState<string | null>(null)
    const [editingUrl, setEditingUrl] = useState('')
    const [localError, setLocalError] = useState<string | null>(null)

    const handleAddSubscriber = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLocalError(null)

        if (!newUrl.trim()) {
            setLocalError('Subscriber URL is required.')
            return
        }

        try {
            await onCreateSubscriber(newUrl.trim())
            setNewUrl('')
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Could not add subscriber.')
        }
    }

    const handleSaveSubscriber = async (subscriberId: string) => {
        setLocalError(null)

        if (!editingUrl.trim()) {
            setLocalError('Subscriber URL is required.')
            return
        }

        try {
            await onUpdateSubscriber(subscriberId, editingUrl.trim())
            setEditingSubscriberId(null)
            setEditingUrl('')
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Could not update subscriber.')
        }
    }

    const handleDelete = async (subscriberId: string) => {
        setLocalError(null)

        try {
            await onDeleteSubscriber(subscriberId)
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Could not delete subscriber.')
        }
    }

    return (
        <section className="mt-6 rounded-3xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Subscribers</h4>
                <span className="text-xs text-slate-500">{subscribers.length} configured</span>
            </div>

            <div className="mt-4 space-y-3">
                {subscribers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                        No subscribers configured for this pipeline yet.
                    </div>
                ) : (
                    subscribers.map((subscriber) => {
                        const isEditing = editingSubscriberId === subscriber.id

                        return (
                            <article key={subscriber.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <input
                                            type="url"
                                            value={editingUrl}
                                            onChange={(event) => setEditingUrl(event.target.value)}
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                                            disabled={isSubmitting}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => void handleSaveSubscriber(subscriber.id)}
                                                disabled={isSubmitting}
                                                className="rounded-full bg-slate-950 px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-white disabled:bg-slate-400"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingSubscriberId(null)
                                                    setEditingUrl('')
                                                }}
                                                disabled={isSubmitting}
                                                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-700"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="font-mono text-xs text-slate-500">{subscriber.id}</p>
                                            <p className="mt-1 break-all text-sm text-slate-700">{subscriber.targetUrl}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingSubscriberId(subscriber.id)
                                                    setEditingUrl(subscriber.targetUrl)
                                                }}
                                                className="rounded-full bg-blue-50 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-blue-700"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void handleDelete(subscriber.id)}
                                                className="rounded-full bg-red-50 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-red-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </article>
                        )
                    })
                )}
            </div>

            <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleAddSubscriber}>
                <input
                    type="url"
                    value={newUrl}
                    onChange={(event) => setNewUrl(event.target.value)}
                    placeholder="https://example.com/webhooks/orders"
                    className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                    disabled={isSubmitting}
                />
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white disabled:bg-slate-400"
                >
                    {isSubmitting ? 'Saving...' : 'Add subscriber'}
                </button>
            </form>

            {localError ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    {localError}
                </div>
            ) : null}
        </section>
    )
}
