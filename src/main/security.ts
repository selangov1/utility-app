import { type Session, type WebContents } from 'electron'
import { isAllowedRequestUrl } from './urls'

/**
 * OS-level backstop for the "client tools never touch the network" rule: any request
 * outside the app origin is cancelled, and every permission prompt is denied.
 */
export function lockDownSession(session: Session, devServerUrl?: string): void {
  session.webRequest.onBeforeRequest((details, callback) => {
    callback({ cancel: !isAllowedRequestUrl(details.url, devServerUrl) })
  })
  session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
  session.setPermissionCheckHandler(() => false)
}

export function lockDownWebContents(contents: WebContents, devServerUrl?: string): void {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
  contents.on('will-navigate', (event, url) => {
    if (!isAllowedRequestUrl(url, devServerUrl)) event.preventDefault()
  })
  contents.on('will-attach-webview', (event) => event.preventDefault())
}
