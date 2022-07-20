import { TodoAccess } from '../dataAccessLayer/todoAcess'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'

const todoAccess = new TodoAccess()
const logger = createLogger('todo')
const bucketName = process.env.ATTACHMENT_S3_BUCKET

export async function getAllTodo(userId: string): Promise<TodoItem[]> {
    return await todoAccess.getAllTodo(userId)
}

export async function createTodo(createTodoRequest:CreateTodoRequest, userId: string): Promise<TodoItem> {
    const todoId = uuid.v4()
    const item: TodoItem = {
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        ...createTodoRequest,
        done: false,
        attachmentUrl: getAttachmentUrl(todoId)
    }
    logger.info(`Creating todo ${item}`)
    return await todoAccess.createTodo(item)
}

export async function updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest): Promise<Boolean> {
    logger.info(`Updating todo ${todoId} of userId ${userId}`, { userId, todoId, updatedTodo: updatedTodo })

    const todo = await todoAccess.getAllTodo(userId)

    if(!todo)
        throw new Error('Todo not found')

    return await todoAccess.updateTodo(userId, todoId, updatedTodo)
  }

export async function deleteTodo(userId: string, todoId: string): Promise<Boolean> {
    logger.info(`Deleting todo ${todoId} of userId ${userId}`, { todoId, userId })

    const todo = await todoAccess.getAllTodo(userId)

    if(!todo)
        throw new Error('Todo not found')

    return await todoAccess.deleteTodo(userId, todoId)
}

function getAttachmentUrl(attachmentId: string): string {
    return `https://${bucketName}.s3.amazonaws.com/${attachmentId}`
}

export async function getSignedUploadUrl(todoId: string): Promise<string> {
    logger.info(`Start getting signedUrl of todoId ${todoId}`)
    return await todoAccess.generateSignedUrl(todoId)
}