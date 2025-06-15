// Package version is used to store the version of the application
import package_json from '../../package.json'

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/v1',
  version: package_json.version
}