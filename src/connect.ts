import { AuthorizedConfig } from './config'
import { configGetter } from './config-state'
import { Connector } from './api/connector'
import {
  createConnection,
  getConnection,
  Connection
} from './api/connection'
import { createAuthorization } from './api/authorization'
import {
  authorize,
  prepareAuthWindowWithConfig,
  AuthWindow
} from './authorize'

async function updateConnection(config: AuthorizedConfig, connection: Connection): Promise<Connection> {
  const newConnection = await getConnection(config, connection.connector.slug)
  return newConnection
}

async function connectWithoutWindow (config: AuthorizedConfig, authWindow: AuthWindow, connector: Connector | string): Promise<Connection> {
  const slug = typeof connector === 'string' ? connector : connector.slug
  const connection = await createConnection(config, slug)
  const authorization = await authorize(config, authWindow, connection.authorization)
  const newConnection = await updateConnection(config, connection)
  return newConnection
}

async function reconnectWithoutWindow (config: AuthorizedConfig, authWindow: AuthWindow, connection: Connection): Promise<Connection> {
  const oldAuthorization = connection.authorization
  if (!oldAuthorization) {
    const newConnection = await connectWithoutWindow(config, authWindow, connection.connector)
    return newConnection
  }

  const authorization = await createAuthorization(config, oldAuthorization.authorizer.prototype.slug)
  const newAuthorization = await authorize(config, authWindow, authorization)
  const newConnection = await updateConnection(config, connection)
  return newConnection
}

export async function connect (callWithConfig: configGetter, connector: Connector | string): Promise<Connection> {
  const connection = await prepareAuthWindowWithConfig(callWithConfig, authWindow => {
    return callWithConfig(config => connectWithoutWindow(config, authWindow, connector))
  })

  return connection
}

export async function reconnect (callWithConfig: configGetter, connection: Connection): Promise<Connection> {
  const newConnection = await prepareAuthWindowWithConfig(callWithConfig, authWindow => {
    return callWithConfig(config => reconnectWithoutWindow(config, authWindow, connection))
  })

  return newConnection
}
