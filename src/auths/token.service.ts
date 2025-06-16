import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import { getJWTConfig } from '../config/jwt'
import { Token } from './token.model'

const jwt_config = getJWTConfig()
const access_secret: Secret = jwt_config.accessKey
const refresh_secret: Secret = jwt_config.refreshKey
const access_expires_in: string = jwt_config.accessTime || '15m'
const refresh_expires_in: string = jwt_config.refreshTime || '7d'

/**
 * Service for handling access and refresh tokens
 */
export class TokenService {
  /**
   * Generates access and refresh tokens for a user
   * @param user - User object
   * @returns Object with access_token and refresh_token
   */
  static generate_tokens(user: any) {
    const access_payload = { user_id: user.uuid, email: user.email }
    const refresh_payload = { user_id: user.uuid, email: user.email }
    const access_options: SignOptions = { expiresIn: access_expires_in as any }
    const refresh_options: SignOptions = { expiresIn: refresh_expires_in as any }

    const access_token = jwt.sign(access_payload, access_secret, access_options)
    const refresh_token = jwt.sign(refresh_payload, refresh_secret, refresh_options)

    return { access_token, refresh_token }
  }

  /**
   * Saves tokens in the database, invalidating previous tokens for the user
   * @param user_id - User UUID
   * @param access_token - Access token
   * @param refresh_token - Refresh token
   * @param access_expires_at - Access token expiry
   * @param refresh_expires_at - Refresh token expiry
   * @returns Created Token instance
   */
  static async save_tokens(user_id: string, access_token: string, refresh_token: string, access_expires_at: Date, refresh_expires_at: Date) {
    // Invalidate previous tokens for this user
    await Token.destroy({ where: { user_id } })
    // Save new tokens
    return Token.create({
      user_id,
      access_token,
      refresh_token,
      access_expires_at,
      refresh_expires_at
    })
  }

  /**
   * Verifies an access token
   * @param token - Access token
   * @returns Decoded payload or null
   */
  static verify_access_token(token: string) {
    try {
      return jwt.verify(token, access_secret)
    } catch (err) {
      return null
    }
  }

  /**
   * Verifies a refresh token
   * @param token - Refresh token
   * @returns Decoded payload or null
   */
  static verify_refresh_token(token: string) {
    try {
      return jwt.verify(token, refresh_secret)
    } catch (err) {
      return null
    }
  }
}

export default TokenService 