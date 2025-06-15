// Package version is used to store the version of the application
import package_json from '../../package.json'

export const environment = {
  production: true,
  apiUrl: 'https://dev.api.octonius.com/v1',
  version: package_json.version
} 