import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Telenor Kunnskapsplattform API',
      version: '1.0.0',
      description:
        'API for kunnskapsplattformen — feilsøking for kunder og agenter hos Telenor.',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Lokalt' },
      { url: 'https://telenor-kb.vercel.app', description: 'Produksjon' },
    ],
    components: {
      schemas: {

        // ─── ENUMS ────────────────────────────────────────────────

        Role: {
          type: 'string',
          enum: ['AGENT', 'CUSTOMER'],
        },

        SessionOutcome: {
          type: 'string',
          enum: ['IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'ABANDONED'],
        },

        TerminalReason: {
          type: 'string',
          enum: [
            'EXTERNAL_REDIRECT',
            'FLOW_EXIT_EXPECTED_SPEED',
            'FLOW_EXIT_NO_NEXT_STEP',
            'FILTERED_CROSS_FLOW',
          ],
        },

        // ─── MODELLER ─────────────────────────────────────────────

        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1abc123' },
            name: { type: 'string', example: 'Ikke på nett' },
            slug: { type: 'string', example: 'ikke-pa-nett' },
            icon: { type: 'string', nullable: true, example: 'wifi-off' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        DeviceType: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx2def456' },
            name: { type: 'string', example: 'Zyxel P8702N' },
            slug: { type: 'string', example: 'zyxel-p8702n' },
            description: {
              type: 'string',
              nullable: true,
              example: 'Flat, mørk fiberboks',
            },
            imageUrl: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        ArticleSummary: {
          type: 'object',
          description: 'Artikkel uten steg — brukes i lister',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', example: 'Internettet virker ikke hjemme' },
            slug: { type: 'string', example: 'internettet-virker-ikke-zyxel' },
            ingress: {
              type: 'string',
              nullable: true,
              example: 'Start ruteren på nytt, sjekk kabler steg for steg.',
            },
            keywords: {
              type: 'array',
              items: { type: 'string' },
              example: ['internett', 'ruter', 'nett'],
            },
            category: { '$ref': '#/components/schemas/Category' },
            deviceType: { '$ref': '#/components/schemas/DeviceType' },
            updatedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        StepChoice: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string', example: 'Ja' },
            buttonText: { type: 'string', nullable: true },
            value: { type: 'string', nullable: true },
            nextStepId: { type: 'string', nullable: true },
            sortOrder: { type: 'integer', example: 0 },
            isTerminal: { type: 'boolean', example: false },
            terminalReason: {
              '$ref': '#/components/schemas/TerminalReason',
              nullable: true,
            },
          },
        },

        Step: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', example: 'Start ruteren på nytt' },
            localeKey: {
              type: 'string',
              example: 'ikke-pa-nett/zyxel_p8702n/restart_ruter',
            },
            agentNote: {
              type: 'string',
              nullable: true,
              description: 'Teknisk notat kun synlig for agenter',
            },
            imageUrl: { type: 'string', nullable: true },
            choices: {
              type: 'array',
              items: { '$ref': '#/components/schemas/StepChoice' },
            },
          },
        },

        ArticleWithSteps: {
          allOf: [
            { '$ref': '#/components/schemas/ArticleSummary' },
            {
              type: 'object',
              properties: {
                steps: {
                  type: 'array',
                  items: { '$ref': '#/components/schemas/Step' },
                },
              },
            },
          ],
        },

        SessionStepAnswer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sessionId: { type: 'string' },
            stepId: { type: 'string' },
            choiceId: { type: 'string', nullable: true },
            customText: { type: 'string', nullable: true },
            step: { '$ref': '#/components/schemas/Step' },
            choice: {
              '$ref': '#/components/schemas/StepChoice',
              nullable: true,
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        Session: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sessionCode: { type: 'string', example: 'A3F9' },
            articleId: { type: 'string' },
            completed: { type: 'boolean', example: false },
            outcome: { '$ref': '#/components/schemas/SessionOutcome' },
            escalationReason: { type: 'string', nullable: true },
            routerModel: {
              type: 'string',
              nullable: true,
              example: 'Zyxel P8702N',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        SessionWithDetails: {
          allOf: [
            { '$ref': '#/components/schemas/Session' },
            {
              type: 'object',
              properties: {
                article: {
                  '$ref': '#/components/schemas/ArticleSummary',
                },
                answers: {
                  type: 'array',
                  items: {
                    '$ref': '#/components/schemas/SessionStepAnswer',
                  },
                },
              },
            },
          ],
        },

        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Ikke funnet' },
          },
        },

        // ─── REQUEST BODIES ───────────────────────────────────────

        CreateSessionBody: {
          type: 'object',
          required: ['articleId'],
          properties: {
            articleId: { type: 'string' },
            routerModel: { type: 'string', example: 'Zyxel P8702N' },
          },
        },

        UpdateSessionBody: {
          type: 'object',
          properties: {
            outcome: { '$ref': '#/components/schemas/SessionOutcome' },
            completed: { type: 'boolean' },
            escalationReason: { type: 'string' },
          },
        },

        CreateAnswerBody: {
          type: 'object',
          required: ['stepId'],
          properties: {
            stepId: { type: 'string' },
            choiceId: { type: 'string', nullable: true },
            customText: { type: 'string', nullable: true },
          },
        },
      },
    },

    // ─── PATHS ──────────────────────────────────────────────────

    paths: {

      '/api/categories': {
        get: {
          summary: 'Hent alle kategorier',
          tags: ['Kategorier'],
          responses: {
            '200': {
              description: 'Liste over kategorier',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { '$ref': '#/components/schemas/Category' },
                  },
                },
              },
            },
            '500': {
              description: 'Serverfeil',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },

      '/api/device-types': {
        get: {
          summary: 'Hent alle rutermodeller',
          tags: ['Rutermodeller'],
          responses: {
            '200': {
              description: 'Liste over rutermodeller',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { '$ref': '#/components/schemas/DeviceType' },
                  },
                },
              },
            },
            '500': {
              description: 'Serverfeil',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },

      '/api/articles': {
        get: {
          summary: 'Hent artikler med filtrering og søk',
          tags: ['Artikler'],
          parameters: [
            {
              name: 'category',
              in: 'query',
              schema: { type: 'string', example: 'ikke-pa-nett' },
              description: 'Slug for kategori',
            },
            {
              name: 'device',
              in: 'query',
              schema: { type: 'string', example: 'zyxel-p8702n' },
              description: 'Slug for rutermodell',
            },
            {
              name: 'q',
              in: 'query',
              schema: { type: 'string', example: 'internett virker ikke' },
              description: 'Søk i tittel, ingress og keywords',
            },
          ],
          responses: {
            '200': {
              description: 'Liste over artikler',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      '$ref': '#/components/schemas/ArticleSummary',
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Serverfeil',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },

      '/api/articles/{slug}': {
        get: {
          summary: 'Hent én artikkel med steg og valg',
          tags: ['Artikler'],
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                example: 'internettet-virker-ikke-zyxel',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Artikkel med steg og valg',
              content: {
                'application/json': {
                  schema: {
                    '$ref': '#/components/schemas/ArticleWithSteps',
                  },
                },
              },
            },
            '404': {
              description: 'Artikkel ikke funnet',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Serverfeil',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },

      '/api/sessions': {
        post: {
          summary: 'Opprett ny feilsøkingssesjon',
          description:
            'Oppretter en sesjon og returnerer en sessionCode kunden kan oppgi til kundeservice.',
          tags: ['Sesjoner'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  '$ref': '#/components/schemas/CreateSessionBody',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Sesjon opprettet',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Session' },
                },
              },
            },
            '400': {
              description: 'Mangler påkrevde felt',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Artikkel ikke funnet',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Serverfeil',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },

      '/api/sessions/{code}': {
        get: {
          summary: 'Hent sesjon med historikk',
          description: 'Brukes av agenter for å slå opp kundens sesjon.',
          tags: ['Sesjoner'],
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              schema: { type: 'string', example: 'A3F9' },
              description: 'Sesjons-ID kunden har fått',
            },
          ],
          responses: {
            '200': {
              description: 'Sesjon med artikkel og svaroversikt',
              content: {
                'application/json': {
                  schema: {
                    '$ref': '#/components/schemas/SessionWithDetails',
                  },
                },
              },
            },
            '404': {
              description: 'Sesjon ikke funnet',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Serverfeil',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        patch: {
          summary: 'Oppdater utfall på sesjon',
          tags: ['Sesjoner'],
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              schema: { type: 'string', example: 'A3F9' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  '$ref': '#/components/schemas/UpdateSessionBody',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Sesjon oppdatert',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Session' },
                },
              },
            },
            '404': {
              description: 'Sesjon ikke funnet',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Serverfeil',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },

      '/api/sessions/{code}/answers': {
        post: {
          summary: 'Logg svar på et steg',
          description:
            'Upsert — kunden kan endre svaret sitt på et steg.',
          tags: ['Sesjoner'],
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              schema: { type: 'string', example: 'A3F9' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  '$ref': '#/components/schemas/CreateAnswerBody',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Svar logget',
              content: {
                'application/json': {
                  schema: {
                    '$ref': '#/components/schemas/SessionStepAnswer',
                  },
                },
              },
            },
            '400': {
              description: 'Mangler påkrevde felt',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Sesjon ikke funnet',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Serverfeil',
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
}

export const swaggerSpec = swaggerJsdoc(options)