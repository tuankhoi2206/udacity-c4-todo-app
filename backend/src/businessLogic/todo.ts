import { TodoAccess } from '../dataLayer/todoAcess'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'

const todoAccess = new TodoAccess()
const logger = createLogger('todo')
const bucketName = process.env.ATTACHMENT_S3_BUCKET

export async function getTodosByUserId(userId: string): Promise<TodoItem[]> {
    return await todoAccess.getTodosByUserId(userId)
}

export async function createTodos(createTodoRequest:CreateTodoRequest, userId: string): Promise<TodoItem> {
    const todoId = uuid.v4()
    logger.info(`Creating new todo with todoId: ${todoId}`, {todoId})
    return await todoAccess.createTodos({
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        ...createTodoRequest,
        done: false,
        attachmentUrl: getAttachmentUrl(todoId)
    })
}

export async function updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest): Promise<Boolean> {
    logger.info(`Updating todo ${todoId} of userId ${userId}`, { userId, todoId, updatedTodo: updatedTodo })
    return await todoAccess.updateTodo(userId, todoId, updatedTodo)
  }

export async function deleteTodoItem(userId: string, todoId: string): Promise<Boolean> {
    logger.info(`Deleting todo ${todoId} of userId ${userId}`, { todoId, userId })
    return await todoAccess.deleteTodoItem(userId, todoId)
}

export async function getSignedUploadUrl(todoId: string): Promise<string> {
    logger.info(`Start getting signedUrl of todoId ${todoId}`)
    return await todoAccess.getSignedUploadUrl(todoId)
}

function getAttachmentUrl(attachmentId: string): string {
    return `https://${bucketName}.s3.amazonaws.com/${attachmentId}`
}