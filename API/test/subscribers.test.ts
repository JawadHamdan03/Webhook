import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import * as pipelinesService from '../src/services/pipelinesService.js'
import * as subscribersService from '../src/services/subscribersService.js'

vi.mock('../src/middleware/apiKeyAuth.js', () => ({
    jwtAuth: (_req: unknown, _res: unknown, next: () => void) => next()
}))

vi.mock('../src/services/pipelinesService.js', () => ({
    getPipelineById: vi.fn()
}))

vi.mock('../src/services/subscribersService.js', () => ({
    createSubscriber: vi.fn(),
    deleteSubscriber: vi.fn(),
    getSubscriberById: vi.fn(),
    listSubscribersByPipelineId: vi.fn(),
    updateSubscriber: vi.fn()
}))

const mockPipeline = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Orders pipeline',
    sourceKey: 'pl_1234567890ab',
    actionType: 'transform',
    actionConfig: {}
}

const mockSubscriber = {
    id: 'sub-1',
    pipelineId: mockPipeline.id,
    targetUrl: 'https://example.com/webhooks/orders',
    createdAt: new Date(),
    updatedAt: new Date()
}

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(pipelinesService.getPipelineById).mockResolvedValue(mockPipeline as never)
})

describe('GET /pipelines/:id/subscribers', () => {
    it('returns subscribers for a pipeline', async () => {
        vi.mocked(subscribersService.listSubscribersByPipelineId).mockResolvedValue([mockSubscriber] as never)

        const res = await request(app).get(`/pipelines/${mockPipeline.id}/subscribers`)

        expect(res.status).toBe(200)
        expect(res.body).toHaveLength(1)
        expect(res.body[0].targetUrl).toBe(mockSubscriber.targetUrl)
    })

    it('returns 404 when the pipeline does not exist', async () => {
        vi.mocked(pipelinesService.getPipelineById).mockResolvedValue(null as never)

        const res = await request(app).get(`/pipelines/${mockPipeline.id}/subscribers`)

        expect(res.status).toBe(404)
        expect(res.body.error).toBe('not_found')
    })
})

describe('POST /pipelines/:id/subscribers', () => {
    it('creates a subscriber', async () => {
        vi.mocked(subscribersService.createSubscriber).mockResolvedValue(mockSubscriber as never)

        const res = await request(app)
            .post(`/pipelines/${mockPipeline.id}/subscribers`)
            .send({ targetUrl: mockSubscriber.targetUrl })

        expect(res.status).toBe(201)
        expect(res.body.targetUrl).toBe(mockSubscriber.targetUrl)
    })

    it('returns 400 for invalid payload', async () => {
        const res = await request(app)
            .post(`/pipelines/${mockPipeline.id}/subscribers`)
            .send({ targetUrl: 'not-a-url' })

        expect(res.status).toBe(400)
        expect(res.body.error).toBe('invalid_request')
    })
})

describe('PUT /pipelines/subscribers/:id', () => {
    it('updates a subscriber', async () => {
        vi.mocked(subscribersService.getSubscriberById).mockResolvedValue(mockSubscriber as never)
        vi.mocked(subscribersService.updateSubscriber).mockResolvedValue({
            ...mockSubscriber,
            targetUrl: 'https://example.com/webhooks/orders-v2'
        } as never)

        const res = await request(app)
            .put(`/pipelines/subscribers/${mockSubscriber.id}`)
            .send({ targetUrl: 'https://example.com/webhooks/orders-v2' })

        expect(res.status).toBe(200)
        expect(res.body.targetUrl).toContain('orders-v2')
    })

    it('returns 404 for missing subscriber', async () => {
        vi.mocked(subscribersService.getSubscriberById).mockResolvedValue(null as never)

        const res = await request(app)
            .put('/pipelines/subscribers/missing')
            .send({ targetUrl: 'https://example.com/webhooks/orders-v2' })

        expect(res.status).toBe(404)
        expect(res.body.error).toBe('not_found')
    })
})

describe('DELETE /pipelines/subscribers/:id', () => {
    it('deletes a subscriber', async () => {
        vi.mocked(subscribersService.deleteSubscriber).mockResolvedValue(mockSubscriber as never)

        const res = await request(app).delete(`/pipelines/subscribers/${mockSubscriber.id}`)

        expect(res.status).toBe(204)
    })

    it('returns 404 for a missing subscriber', async () => {
        vi.mocked(subscribersService.deleteSubscriber).mockResolvedValue(null as never)

        const res = await request(app).delete('/pipelines/subscribers/missing')

        expect(res.status).toBe(404)
        expect(res.body.error).toBe('not_found')
    })
})