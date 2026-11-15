/* eslint-disable quote-props */

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'NutriCommunity Backend API',
    version: '1.0.0',
    description: 'API REST para autenticación, publicaciones, comentarios, reacciones y administración de usuarios.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Entorno local'
    }
  ],
  tags: [
    { name: 'Health', description: 'Estado del servicio' },
    { name: 'Authentication', description: 'Inicio y administración de sesiones' },
    { name: 'Content types', description: 'Tipos de publicación' },
    { name: 'Posts', description: 'Publicaciones' },
    { name: 'Comments', description: 'Comentarios de publicaciones' },
    { name: 'Reactions', description: 'Reacciones de publicaciones' },
    { name: 'Administration', description: 'Operaciones administrativas' }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Comprobar el estado del servicio',
        responses: {
          '200': {
            description: 'Servicio disponible',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Iniciar sesión',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Sesión iniciada. También establece las cookies de refresh y CSRF.',
            headers: {
              'Set-Cookie': {
                description: 'Cookies refresh_token y csrf_token',
                schema: { type: 'string' }
              }
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/InvalidCredentials' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Obtener el usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Usuario autenticado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/User' } }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Renovar la sesión',
        description: 'Rota el refresh token y devuelve un access token nuevo.',
        security: [{ refreshCookie: [], csrfCookie: [], csrfHeader: [] }],
        responses: {
          '200': {
            description: 'Sesión renovada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RefreshResponse' }
              }
            }
          },
          '401': { $ref: '#/components/responses/InvalidRefreshSession' },
          '403': { $ref: '#/components/responses/InvalidCsrf' }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Cerrar sesión',
        security: [{ bearerAuth: [], refreshCookie: [], csrfCookie: [], csrfHeader: [] }],
        responses: {
          '204': { description: 'Sesión cerrada y cookies limpiadas' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/InvalidCsrf' }
        }
      }
    },
    '/api/content-types': {
      get: {
        tags: ['Content types'],
        summary: 'Listar tipos de publicación',
        responses: {
          '200': {
            description: 'Tipos de publicación disponibles',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ContentType' }
                }
              }
            }
          }
        }
      }
    },
    '/api/posts': {
      get: {
        tags: ['Posts'],
        summary: 'Listar publicaciones publicadas',
        parameters: [{ $ref: '#/components/parameters/Page' }, { $ref: '#/components/parameters/Limit' }],
        responses: {
          '200': {
            description: 'Publicaciones paginadas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
                    pagination: { $ref: '#/components/schemas/Pagination' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Posts'],
        summary: 'Crear una publicación',
        security: [{ bearerAuth: [], csrfHeader: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreatePostRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Publicación creada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Post' } } }
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/InvalidCsrf' }
        }
      }
    },
    '/api/posts/{postId}': {
      parameters: [{ $ref: '#/components/parameters/PostId' }],
      get: {
        tags: ['Posts'],
        summary: 'Obtener el detalle de una publicación',
        responses: {
          '200': {
            description: 'Detalle de la publicación',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Post' } } }
          },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      },
      patch: {
        tags: ['Posts'],
        summary: 'Actualizar una publicación',
        security: [{ bearerAuth: [], csrfHeader: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdatePostRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Publicación actualizada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Post' } } }
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['Posts'],
        summary: 'Eliminar una publicación',
        description: 'Realiza una eliminación lógica. Solo el autor o un administrador pueden ejecutarla.',
        security: [{ bearerAuth: [], csrfHeader: [] }],
        responses: {
          '204': { description: 'Publicación eliminada' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/post/{postId}/comments': {
      parameters: [{ $ref: '#/components/parameters/PostId' }],
      get: {
        tags: ['Comments'],
        summary: 'Listar comentarios de una publicación',
        parameters: [{ $ref: '#/components/parameters/Page' }, { $ref: '#/components/parameters/CommentLimit' }],
        responses: {
          '200': {
            description: 'Comentarios paginados',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
                    pagination: { $ref: '#/components/schemas/Pagination' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/posts/{postId}/comments': {
      parameters: [{ $ref: '#/components/parameters/PostId' }],
      post: {
        tags: ['Comments'],
        summary: 'Crear un comentario',
        security: [{ bearerAuth: [], csrfHeader: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCommentRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Comentario creado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Comment' } } }
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/InvalidCsrf' }
        }
      }
    },
    '/api/comments/{commentId}': {
      parameters: [{ $ref: '#/components/parameters/CommentId' }],
      delete: {
        tags: ['Comments'],
        summary: 'Eliminar un comentario',
        security: [{ bearerAuth: [], csrfHeader: [] }],
        responses: {
          '204': { description: 'Comentario eliminado' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/api/posts/{postId}/reaction': {
      parameters: [{ $ref: '#/components/parameters/PostId' }],
      put: {
        tags: ['Reactions'],
        summary: 'Agregar, cambiar o quitar una reacción',
        description: 'Repetir la reacción activa la elimina. Solo puede existir una reacción por usuario y publicación.',
        security: [{ bearerAuth: [], csrfHeader: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ReactionRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Reacción actualizada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ReactionResponse' } } }
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/InvalidCsrf' }
        }
      }
    },
    '/api/admin/users': {
      get: {
        tags: ['Administration'],
        summary: 'Listar usuarios',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/Page' }, { $ref: '#/components/parameters/Limit' }],
        responses: {
          '200': {
            description: 'Usuarios paginados',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    pagination: { $ref: '#/components/schemas/Pagination' }
                  }
                }
              }
            }
          },
          '403': { $ref: '#/components/responses/Forbidden' }
        }
      },
      post: {
        tags: ['Administration'],
        summary: 'Crear un usuario participante',
        security: [{ bearerAuth: [], csrfHeader: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterUserRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Usuario creado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/User' } }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '409': { description: 'El correo ya está registrado' }
        }
      }
    },
    '/api/admin/users/{userId}/status': {
      parameters: [{ $ref: '#/components/parameters/UserId' }],
      patch: {
        tags: ['Administration'],
        summary: 'Actualizar el estado de un usuario',
        security: [{ bearerAuth: [], csrfHeader: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserStatusRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Estado actualizado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      csrfHeader: { type: 'apiKey', in: 'header', name: 'X-CSRF-Token' },
      refreshCookie: { type: 'apiKey', in: 'cookie', name: 'refresh_token' },
      csrfCookie: { type: 'apiKey', in: 'cookie', name: 'csrf_token' }
    },
    parameters: {
      Page: {
        name: 'page',
        in: 'query',
        description: 'Número de página',
        schema: { type: 'integer', minimum: 1, default: 1 }
      },
      Limit: {
        name: 'limit',
        in: 'query',
        description: 'Cantidad de registros por página',
        schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 }
      },
      CommentLimit: {
        name: 'limit',
        in: 'query',
        description: 'Cantidad de comentarios por página',
        schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 }
      },
      PostId: {
        name: 'postId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' }
      },
      CommentId: {
        name: 'commentId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' }
      },
      UserId: {
        name: 'userId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' }
      }
    },
    responses: {
      ValidationError: {
        description: 'Los datos enviados no son válidos',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
      },
      Unauthorized: {
        description: 'Autenticación requerida o token inválido',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
      },
      Forbidden: {
        description: 'Permisos insuficientes',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
      },
      InvalidCsrf: {
        description: 'Token CSRF inválido',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
      },
      InvalidCredentials: {
        description: 'Credenciales inválidas',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
      },
      InvalidRefreshSession: {
        description: 'Sesión de refresh inválida o expirada',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
      }
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          service: { type: 'string', example: 'nutricommunity-backend' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'usuario@example.com' },
          password: { type: 'string', format: 'password', example: 'UnaClaveSegura123!' }
        }
      },
      RegisterUserRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string', example: 'Ana' },
          secondName: { type: 'string', nullable: true, example: 'María' },
          lastName: { type: 'string', example: 'López' },
          secondLastName: { type: 'string', nullable: true, example: 'García' },
          email: { type: 'string', format: 'email', example: 'ana@example.com' },
          password: { type: 'string', format: 'password', example: 'UnaClaveSegura123!' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          user: { $ref: '#/components/schemas/User' }
        }
      },
      RefreshResponse: {
        type: 'object',
        properties: { accessToken: { type: 'string' } }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          firstName: { type: 'string' },
          secondName: { type: 'string', nullable: true },
          lastName: { type: 'string' },
          secondLastName: { type: 'string', nullable: true },
          email: { type: 'string', format: 'email' },
          status: { type: 'string', enum: ['active', 'suspended', 'deleted'] },
          roles: { type: 'array', items: { type: 'string', example: 'participant' } }
        }
      },
      ContentType: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', example: 'recipe' },
          name: { type: 'string', example: 'Receta' }
        }
      },
      Post: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          authorId: { type: 'string', format: 'uuid' },
          authorName: { type: 'string' },
          contentTypeId: { type: 'string', format: 'uuid' },
          contentTypeName: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['draft', 'published', 'archived', 'deleted'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      CreatePostRequest: {
        type: 'object',
        required: ['title', 'contentTypeId'],
        properties: {
          title: { type: 'string', minLength: 3, maxLength: 180 },
          description: { type: 'string', maxLength: 2000, nullable: true },
          contentTypeId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['draft', 'published'], default: 'draft' }
        }
      },
      UpdatePostRequest: {
        type: 'object',
        minProperties: 1,
        properties: {
          title: { type: 'string', minLength: 3, maxLength: 180 },
          description: { type: 'string', maxLength: 2000, nullable: true },
          contentTypeId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] }
        }
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          postId: { type: 'string', format: 'uuid' },
          authorId: { type: 'string', format: 'uuid' },
          authorName: { type: 'string' },
          body: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      CreateCommentRequest: {
        type: 'object',
        required: ['body'],
        properties: { body: { type: 'string', minLength: 1, maxLength: 2000 } }
      },
      ReactionRequest: {
        type: 'object',
        required: ['type'],
        properties: { type: { type: 'string', enum: ['like', 'love', 'amaze'] } }
      },
      ReactionResponse: {
        type: 'object',
        properties: {
          postId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['like', 'love', 'amaze'], nullable: true }
        }
      },
      UpdateUserStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: { status: { type: 'string', enum: ['active', 'suspended', 'deleted'] } }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          hasMore: { type: 'boolean' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: { message: { type: 'string' }, issues: { type: 'array' } }
      }
    }
  }
} as const
