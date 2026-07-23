import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'
import { readFile } from 'node:fs/promises'

let openApiDocument: unknown
let documentationPage: string | undefined

async function loadOpenApiDocument() {
  if (openApiDocument === undefined) {
    const source = await readFile(app.makePath('resources/openapi.json'), 'utf8')
    openApiDocument = JSON.parse(source)
  }

  return openApiDocument
}

async function loadDocumentationPage() {
  documentationPage ??= await readFile(app.makePath('resources/api-docs.html'), 'utf8')
  return documentationPage
}

export default class ApiDocsController {
  async show({ response }: HttpContext) {
    return response
      .header('Cache-Control', 'public, max-age=300')
      .type('text/html; charset=utf-8')
      .send(await loadDocumentationPage())
  }

  async spec({ response }: HttpContext) {
    return response
      .header('Cache-Control', 'public, max-age=300')
      .type('application/json; charset=utf-8')
      .send(await loadOpenApiDocument())
  }
}
