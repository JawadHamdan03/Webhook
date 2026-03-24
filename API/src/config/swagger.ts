import swaggerJSDoc from 'swagger-jsdoc'

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Webhook Processing Platform API',
            version: '1.0.0',
            description: 'API for authentication, pipeline management, webhook ingestion, and job observability.'
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Local development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['src/routes/*.ts']
}

export const swaggerSpec = swaggerJSDoc(options)