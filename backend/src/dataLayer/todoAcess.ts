import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { createLogger } from '../utils/logger'
import { TodoUpdate } from '../models/TodoUpdate';

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('todoAccess')

export class TodoAccess {
    constructor (
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
    ){}

    async getTodosByUserId(userId: string): Promise<TodoItem[]> {
        logger.info(`Get all todo items belong to user id ${userId}.`)
        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false
        }).promise()

        const items = result.Items
        logger.info(`There are ${items.length} items found.`)

        return items as TodoItem[]
    }

    async createTodos(todoData:TodoItem): Promise<TodoItem> {
        logger.info(`Creating new todo of user [#${todoData.userId}]`)
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todoData
        }).promise()
        return todoData
    }

    async updateTodo(userId: string, todoId: string, todoUpdate: TodoUpdate): Promise<Boolean> {
        logger.info(`Updating todo ${todoId} of userId ${userId}`);
        let resultUpdate = true

        try {
            await this.docClient.update({
                TableName: this.todosTable,
                Key: {userId: userId, todoId: todoId},
                UpdateExpression: 'set #name = :name, #dueDate = :dueDate, #done = :done',
                ExpressionAttributeNames: {
                    "#name": "name",
                    "#dueDate": "dueDate",
                    "#done": "done"
                },
                ExpressionAttributeValues: {
                    ":name": todoUpdate.name,
                    ":dueDate": todoUpdate.dueDate,
                    ":done": todoUpdate.done
                }
            }).promise()
        } catch (error) {
            resultUpdate = false
            logger.error(`There was an error updating detail: ${error}`)
        }

        return resultUpdate
    }

    async deleteTodoItem(userId: string, todoId: string): Promise<boolean> {
        logger.info(`Deleting todo ${todoId} of userId ${userId}`);
        let resultDelete = true

        try {
            await this.docClient.delete({
                TableName: this.todosTable,
                Key: {userId: userId, todoId: todoId}
            }).promise()
            logger.info(`Deleted todo successfully!`)
        } catch (error) {
            resultDelete = false
            logger.error(`There was an error deleting detail: ${error}`)
        }
        
        return resultDelete;
    }

    async getSignedUploadUrl(attachmentId: string): Promise<string> {
      return this.s3.getSignedUrl('putObject', {
        Bucket: this.bucketName,
        Key: attachmentId,
        Expires: parseInt(this.urlExpiration)
      })
    }
}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
      console.log('Creating a local DynamoDB instance')
      return new XAWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      })
    }
  
    return new XAWS.DynamoDB.DocumentClient()
}