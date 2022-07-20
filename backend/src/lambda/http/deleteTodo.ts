import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { deleteTodoItem } from '../../businessLogic/todo'
import { getUserId } from '../utils'
import 'source-map-support/register'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)
    const isDeleteSuccess = deleteTodoItem(userId, todoId)
    if (!isDeleteSuccess) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "There was an error when deleting."
        })
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Todo ${todoId} was deleted successfully.`
      })
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
