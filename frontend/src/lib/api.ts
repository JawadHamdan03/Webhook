const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: unknown
    token?: string
}

const request = async <T>(path: string, options: RequestOptions = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method ?? 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
        },
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
    })

    const text = await response.text()
    const data = text ? (JSON.parse(text) as T | { error?: string }) : null

    if (!response.ok) {
        const message = data && typeof data === 'object' && 'error' in data && data.error ? data.error : 'request_failed'
        throw new Error(message)
    }

    return data as T
}

export type LoginResponse = {
    token: string
}

export type Pipeline = {
    id: string
    name: string
    sourceKey: string
    actionType: 'add_fields' | 'transform' | 'filter'
    actionConfig: Record<string, unknown>
    createdAt?: string
    updatedAt?: string
}

export type Subscriber = {
    id: string
    pipelineId: string
    targetUrl: string
    createdAt?: string
    updatedAt?: string
}

export type Job = {
    id: string
    pipelineId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    payload: Record<string, unknown>
    processedOutput?: Record<string, unknown> | null
    errorMessage?: string | null
    attemptCount?: number
    createdAt?: string
    processedAt?: string | null
    updatedAt?: string
}

export type DeliveryAttempt = {
    id: string
    jobId: string
    subscriberId: string
    attemptNumber: number
    status: 'pending' | 'success' | 'failed'
    responseStatus?: number | null
    responseBody?: string | null
    errorMessage?: string | null
    nextRetryAt?: string | null
    createdAt?: string
    updatedAt?: string
}

export type WebhookAcceptedResponse = {
    accepted: boolean
    jobId: string
}

export const login = (email: string, password: string) => {
    return request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email, password }
    })
}

export const register = (email: string, password: string) => {
    return request<LoginResponse>('/auth/register', {
        method: 'POST',
        body: { email, password }
    })
}

export const getPipelines = (token: string) => {
    return request<Pipeline[]>('/pipelines', { token })
}

export const getJobs = (token: string) => {
    return request<Job[]>('/jobs', { token })
}

export const getJobById = (id: string, token?: string) => {
    return request<Job>(`/jobs/${id}`, { token })
}

export const getJobDeliveries = (id: string, token?: string) => {
    return request<DeliveryAttempt[]>(`/jobs/${id}/deliveries`, { token })
}

export const sendTestWebhook = (sourceKey: string, payload: Record<string, unknown>) => {
    return request<WebhookAcceptedResponse>(`/webhooks/${sourceKey}`, {
        method: 'POST',
        body: payload
    })
}

export const getPipelineById = (id: string, token: string) => {
    return request<Pipeline>(`/pipelines/${id}`, { token })
}

export const getSubscribersByPipelineId = (pipelineId: string, token: string) => {
    return request<Subscriber[]>(`/pipelines/${pipelineId}/subscribers`, { token })
}

export const createSubscriber = (pipelineId: string, targetUrl: string, token: string) => {
    return request<Subscriber>(`/pipelines/${pipelineId}/subscribers`, {
        method: 'POST',
        body: { targetUrl },
        token
    })
}

export const updateSubscriber = (subscriberId: string, targetUrl: string, token: string) => {
    return request<Subscriber>(`/pipelines/subscribers/${subscriberId}`, {
        method: 'PUT',
        body: { targetUrl },
        token
    })
}

export const deleteSubscriber = (subscriberId: string, token: string) => {
    return request<void>(`/pipelines/subscribers/${subscriberId}`, {
        method: 'DELETE',
        token
    })
}

export const createPipeline = (
    payload: Pick<Pipeline, 'name' | 'actionType' | 'actionConfig'> & { sourceKey?: string },
    token: string
) => {
    return request<Pipeline>('/pipelines', {
        method: 'POST',
        body: payload,
        token
    })
}

export const updatePipeline = (
    id: string,
    payload: Partial<Pick<Pipeline, 'name' | 'actionType' | 'actionConfig'>>,
    token: string
) => {
    return request<Pipeline>(`/pipelines/${id}`, {
        method: 'PUT',
        body: payload,
        token
    })
}

export const deletePipeline = (id: string, token: string) => {
    return request<void>(`/pipelines/${id}`, {
        method: 'DELETE',
        token
    })
}

export { API_BASE_URL }