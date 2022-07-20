import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { getTodosByUserId } from '../../businessLogic/todo'
import { getUserId } from '../utils';
import { createLogger } from '../../utils/logger'

const logger = createLogger('getTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    logger.info('Start getTodos processing', { event })
    const userId = getUserId(event)
    const todo = await getTodosByUserId(userId)
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        items: todo
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
