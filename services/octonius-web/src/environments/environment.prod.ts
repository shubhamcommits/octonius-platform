// Package version is used to store the version of the application
import package_json from '../../package.json'

export const environment = {
  production: true,
  apiUrl: 'https://api.octonius.com/v1',
  version: package_json.version,
  defaultAvatarUrl: 'https://media.octonius.com/assets/icon_avatar.svg'
}