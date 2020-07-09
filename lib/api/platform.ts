import { IKitConfig } from '../config'
import { request } from './request'

export interface Platform {
  name: string,
  domain: string,
  website: string,
  login_redirect_url: string
}

export async function getPlatform(config: IKitConfig): Promise<Platform> {
  const {
    platform
  } = await request(config, {
    path: `/platform`
  })

  return platform as Platform
}
