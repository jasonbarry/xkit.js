import { AuthorizedConfig, IKitConfig } from '../config'
import { request, IKitAPIError } from './request'
import { Connector, getConnector, getConnectorPublic } from './connector'
import { Authorization, AuthorizationStatus } from './authorization'
import { hasOwnProperty } from '../util'

export interface ConnectionOnly {
  enabled: boolean,
  authorization?: Authorization
}

export interface Connection extends ConnectionOnly {
  connector: Connector
}

export interface ConnectionShell {
  connector: Connector
}

export enum ConnectionStatus {
  NotInstalled,
  Error,
  Connected
}

export function isConnection(conn: ConnectionOnly | ConnectionShell | undefined): conn is Connection {
  return conn && hasOwnProperty(conn, 'enabled') && conn.enabled != null
}

export function connectionStatus(conn: ConnectionOnly | ConnectionShell | undefined): ConnectionStatus {
  if (!isConnection(conn)) {
    return ConnectionStatus.NotInstalled
  }

  if (!conn.enabled) {
    return ConnectionStatus.NotInstalled
  }

  const { authorization } = conn
  if (authorization && authorization.status !== AuthorizationStatus.error) {
    return ConnectionStatus.Connected
  }

  return ConnectionStatus.Error
}

export async function getConnection(config: AuthorizedConfig, connectorSlug: string): Promise<Connection> {
  const {
    connection
  } = await request(config, {
    path: `/connections/${connectorSlug}`
  })

  return connection as Connection
}

export async function getConnectionOrConnector(config: AuthorizedConfig, connectorSlug: string): Promise<Connection | ConnectionShell> {
  try {
    const connection = await getConnection(config, connectorSlug)
    return connection
  } catch (e) {
    if (e instanceof IKitAPIError && e.statusCode === 404) {
      const connector = await getConnector(config, connectorSlug)
      return { connector }
    }
    throw e
  }
}

export async function getConnectionPublic(config: IKitConfig, connectorSlug: string): Promise<ConnectionShell> {
  const connector = await getConnectorPublic(config, connectorSlug)
  return { connector }
}

export async function getConnectionToken(config: AuthorizedConfig, connectorSlug: string): Promise<string | null> {
  try {
    const connection = await getConnection(config, connectorSlug)
    if (connection.enabled && connection.authorization && connection.authorization.access_token) {
      return connection.authorization.access_token
    }
  } catch (e) {
    if (!(e instanceof IKitAPIError && e.statusCode === 404)) {
      throw e
    }
  }
  return null
}

export async function createConnection(config: AuthorizedConfig, connectorSlug: string): Promise<Connection> {
  const {
    connection
  } = await request(config, {
    path: `/connections/${connectorSlug}`,
    method: 'POST'
  })

  return connection as Connection
}

export async function removeConnection(config: AuthorizedConfig, connectorSlug: string): Promise<void> {
  await request(config, {
    path: `/connections/${connectorSlug}`,
    method: 'DELETE'
  })
}
