import { useState } from 'react'
import type { Pipeline } from '../lib/api'

type ActionType = 'add_fields' | 'transform' | 'filter' | 'remove_fields' | 'lowercase' | 'mask_fields'

export type PipelineFormData = {
    name: string
    actionType: ActionType
    actionConfig: Record<string, unknown>
}

type PipelineFormProps = {
    initialData?: Pipeline
    onSubmit: (data: PipelineFormData) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    error?: string | null
}

export function PipelineForm({ initialData, onSubmit, onCancel, isLoading, error }: PipelineFormProps) {
    const [formData, setFormData] = useState<PipelineFormData>({
        name: initialData?.name ?? '',
        actionType: initialData?.actionType ?? 'add_fields',
        actionConfig: initialData?.actionConfig ?? {}
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(formData)
    }

    const updateActionConfig = (updates: Record<string, unknown>) => {
        setFormData(prev => ({
            ...prev,
            actionConfig: { ...prev.actionConfig, ...updates }
        }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pipeline Name
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Pipeline"
                    required
                    disabled={isLoading}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Type
                </label>
                <select
                    value={formData.actionType}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        actionType: e.target.value as ActionType,
                        actionConfig: {}
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                >
                    <option value="add_fields">Add Fields</option>
                    <option value="transform">Transform</option>
                    <option value="filter">Filter</option>
                    <option value="remove_fields">Remove Fields</option>
                    <option value="lowercase">Lowercase Fields</option>
                    <option value="mask_fields">Mask Fields</option>
                </select>
            </div>


            {formData.actionType === 'add_fields' && (
                <AddFieldsConfig config={formData.actionConfig} onChange={updateActionConfig} disabled={isLoading} />
            )}


            {formData.actionType === 'transform' && (
                <TransformConfig config={formData.actionConfig} onChange={updateActionConfig} disabled={isLoading} />
            )}


            {formData.actionType === 'filter' && (
                <FilterConfig config={formData.actionConfig} onChange={updateActionConfig} disabled={isLoading} />
            )}

            {formData.actionType === 'remove_fields' && (
                <FieldsListConfig
                    title="Fields to Remove"
                    placeholder="password, token, internalNotes"
                    config={formData.actionConfig}
                    onChange={updateActionConfig}
                    disabled={isLoading}
                />
            )}

            {formData.actionType === 'lowercase' && (
                <FieldsListConfig
                    title="Fields to Lowercase"
                    placeholder="email, country"
                    config={formData.actionConfig}
                    onChange={updateActionConfig}
                    disabled={isLoading}
                />
            )}

            {formData.actionType === 'mask_fields' && (
                <MaskFieldsConfig config={formData.actionConfig} onChange={updateActionConfig} disabled={isLoading} />
            )}

            <div className="flex gap-2 pt-4">
                <button
                    type="submit"
                    disabled={isLoading || !formData.name}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Saving...' : initialData ? 'Update Pipeline' : 'Create Pipeline'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}

function AddFieldsConfig({
    config,
    onChange,
    disabled
}: {
    config: Record<string, unknown>
    onChange: (updates: Record<string, unknown>) => void
    disabled?: boolean
}) {
    const add = (config.add as Record<string, unknown>) || {}

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                Fields to Add (JSON)
            </label>
            <textarea
                value={JSON.stringify(add, null, 2)}
                onChange={(e) => {
                    try {
                        const parsed = JSON.parse(e.target.value)
                        onChange({ add: parsed })
                    } catch {
                        // Allow invalid JSON while typing
                    }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='{"fieldName": "value"}'
                rows={4}
                disabled={disabled}
            />
        </div>
    )
}

function TransformConfig({
    config,
    onChange,
    disabled
}: {
    config: Record<string, unknown>
    onChange: (updates: Record<string, unknown>) => void
    disabled?: boolean
}) {
    const pick = (config.pick as string[]) || []
    const uppercase = (config.uppercase as string[]) || []

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fields to Pick (comma-separated)
                </label>
                <input
                    type="text"
                    value={pick.join(', ')}
                    onChange={(e) =>
                        onChange({
                            pick: e.target.value.split(',').map(s => s.trim()).filter(Boolean) || undefined
                        })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="field1, field2, field3"
                    disabled={disabled}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fields to Uppercase (comma-separated)
                </label>
                <input
                    type="text"
                    value={uppercase.join(', ')}
                    onChange={(e) =>
                        onChange({
                            uppercase: e.target.value.split(',').map(s => s.trim()).filter(Boolean) || undefined
                        })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="field1, field2"
                    disabled={disabled}
                />
            </div>
        </div>
    )
}

function FilterConfig({
    config,
    onChange,
    disabled
}: {
    config: Record<string, unknown>
    onChange: (updates: Record<string, unknown>) => void
    disabled?: boolean
}) {
    const field = (config.field as string) || ''
    const equals = config.equals
    const greaterThan = (config.greaterThan as number) || ''
    const lessThan = (config.lessThan as number) || ''

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field to Filter
                </label>
                <input
                    type="text"
                    value={field}
                    onChange={(e) => onChange({ field: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="fieldName"
                    disabled={disabled}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equals (leave empty to skip)
                </label>
                <input
                    type="text"
                    value={equals ? String(equals) : ''}
                    onChange={(e) => onChange({ equals: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="value"
                    disabled={disabled}
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Greater Than
                    </label>
                    <input
                        type="number"
                        value={greaterThan}
                        onChange={(e) => onChange({ greaterThan: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        disabled={disabled}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Less Than
                    </label>
                    <input
                        type="number"
                        value={lessThan}
                        onChange={(e) => onChange({ lessThan: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="100"
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    )
}

function FieldsListConfig({
    title,
    placeholder,
    config,
    onChange,
    disabled
}: {
    title: string
    placeholder: string
    config: Record<string, unknown>
    onChange: (updates: Record<string, unknown>) => void
    disabled?: boolean
}) {
    const fields = (config.fields as string[]) || []

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {title} (comma-separated)
            </label>
            <input
                type="text"
                value={fields.join(', ')}
                onChange={(e) =>
                    onChange({
                        fields: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={placeholder}
                disabled={disabled}
            />
        </div>
    )
}

function MaskFieldsConfig({
    config,
    onChange,
    disabled
}: {
    config: Record<string, unknown>
    onChange: (updates: Record<string, unknown>) => void
    disabled?: boolean
}) {
    const fields = (config.fields as string[]) || []
    const mask = (config.mask as string) || '***'

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fields to Mask (comma-separated)
                </label>
                <input
                    type="text"
                    value={fields.join(', ')}
                    onChange={(e) =>
                        onChange({
                            fields: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="password, cardNumber, ssn"
                    disabled={disabled}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mask Value
                </label>
                <input
                    type="text"
                    value={mask}
                    onChange={(e) => onChange({ mask: e.target.value || '***' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="***"
                    disabled={disabled}
                />
            </div>
        </div>
    )
}
