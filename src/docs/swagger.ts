import type { Request, Response } from 'express'
import { openApiDocument } from './openapi.js'

export const swaggerEnabled = (): boolean => (
  process.env.SWAGGER_ENABLED === 'true' || process.env.NODE_ENV !== 'production'
)

export const sendOpenApiDocument = (
  _request: Request,
  response: Response
): void => {
  response.json(openApiDocument)
}

export const sendSwaggerUi = (
  _request: Request,
  response: Response
): void => {
  response.type('html').send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NutriCommunity API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/api-docs/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis],
          layout: 'BaseLayout'
        })
      }
    </script>
  </body>
</html>`)
}
