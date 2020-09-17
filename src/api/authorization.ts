import { AuthorizedConfig } from '../config'
import Emitter from '../emitter'
import { request } from './request'
import { subscribe, leave } from './socket'
import { Channel } from 'phoenix'
import { PublicConnector } from './connector'

type AuthorizeUrl = string

interface AuthorizerPrototype {
  name: string,
  slug: string,
  api_key_video_url?: string,
  api_key_instructions?: string,
  api_key_label?: string
}

interface Authorizer {
  client_id: string,
  prototype: AuthorizerPrototype
}

export enum AuthorizationStatus {
  awaiting_callback = "awaiting_callback",
  retrieving_tokens = "retrieving_tokens",
  active = "active",
  error = "error"
}

export interface Authorization {
  id: number | string,
  status: AuthorizationStatus,
  authorizer: Authorizer,
  access_token?: string,
  authorize_url?: AuthorizeUrl,
  initiating_connector?: PublicConnector,
  state?: string
}

function isStatus(status: string): status is AuthorizationStatus {
  const statuses: string[] = Object.values(AuthorizationStatus)
  return statuses.includes(status)
}

export function isComplete(status: string): boolean {
  const completeStatuses: string[] = [AuthorizationStatus.active, AuthorizationStatus.error]
  return completeStatuses.includes(status)
}

// TODO: Don't hardcode this in here
export function loadingPath(authorization?: Authorization): string {
  if (!authorization) {
    return '/authorizations/loading'
  }
  return `/authorizations/${authorization.authorizer.prototype.slug}/loading`
}

export async function createAuthorization(config: AuthorizedConfig, prototypeSlug: string): Promise<Authorization> {
  const {
    authorization
  } = await request(config, {
    path: `/authorizations/${prototypeSlug}`,
    method: 'POST'
  })

  return authorization as Authorization
}

export async function setAuthorizationAPIKey(config: AuthorizedConfig, prototypeSlug: string, state: string, apiKey: string): Promise<Authorization> {
  const {
    authorization
  } = await request(config, {
    path: `/authorizations/${prototypeSlug}`,
    method: 'PUT',
    body: {
      state,
      api_key: apiKey
    }
  })

  return authorization as Authorization
}

export async function getAuthorization(config: AuthorizedConfig, prototypeSlug: string, authorizationId: string | number): Promise<Authorization> {
  const {
    authorization
  } = await request(config, {
    path: `/authorizations/${prototypeSlug}/${authorizationId}`
  })

  return authorization as Authorization
}

export async function subscribeToStatus(config: AuthorizedConfig, authorizationId: string | number): Promise<[Emitter, AuthorizationStatus]> {
  const emitter = new Emitter()
  const [channel, { status }] = (await subscribe(config, `authorization_status:${authorizationId}`)) as [Channel, { status: string }]
  console.debug(`Subscribed to channel`, channel)

  if (!isStatus(status)) {
    throw new Error(`Invalid status returned from subscription: ${status}`)
  }

  if (isComplete(status)) {
    console.debug(`Removing subscription to authorization status, already in a terminal state: ${status}.`)
    await leave(channel)
    return [null, status as AuthorizationStatus]
  }

  channel.onError((err: Error | string) => {
    emitter.emit('error', { error: err })
  })

  channel.onClose(() => {
    emitter.emit('close')
  })

  channel.on('status_update', async ({ status }) => {
    emitter.emit('status_update', { status })

    if (isComplete(status)) {
      console.debug(`Removing subscription to authorization status, now in a terminal state: ${status}.`)
      await leave(channel)
      return
    }
  })

  return [emitter, status]
}
