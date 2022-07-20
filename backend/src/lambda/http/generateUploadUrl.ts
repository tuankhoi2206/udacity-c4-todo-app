import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { cors } from 'middy/middlewares'
import { getSignedUploadUrl } from '../../businessLogic/todo'
import 'source-map-support/register'
import * as middy from 'middy'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const signedUrl = await getSignedUploadUrl(todoId)
    
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        uploadUrl: signedUrl
      })
    }
  }
)

handler.use(
    cors({
      credentials: true
    })
  )
