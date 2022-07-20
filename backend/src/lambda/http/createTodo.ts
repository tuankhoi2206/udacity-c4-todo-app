import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createTodos } from  '../../businessLogic/todo'
import { createLogger } from '../../utils/logger'
import 'source-map-support/register'
import * as middy from 'middy'

const logger = createLogger('getTodos')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    logger.info('Start creating todo', { event })
    const todoRequest: CreateTodoRequest = JSON.parse(event.body)
    const userId = getUserId(event)
    const newTodo = await createTodos(todoRequest, userId);

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        item: newTodo
      })
    }
  })

handler.use(
  cors({
    credentials: true
  })
)
