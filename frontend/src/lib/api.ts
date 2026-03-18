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

export type Job = {
    id: string
    pipelineId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    payload: Record<string, unknown>
    processedOutput?: Record<string, unknown> | null
    errorMessage?: string | null
    createdAt?: string
    updatedAt?: string
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

export const getPipelineById = (id: string, token: string) => {
    return request<Pipeline>(`/pipelines/${id}`, { token })
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