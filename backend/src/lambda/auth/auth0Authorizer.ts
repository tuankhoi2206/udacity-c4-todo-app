import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { JwtPayload } from '../../auth/JwtPayload'
import 'source-map-support/register'

const logger = createLogger('auth')
const jwksUrl = 'https://dev-u2fmzkni.us.auth0.com/.well-known/jwks.json'

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  console.log('Start checking token in header.')

  if (!authHeader)
    throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]
  const cert = await getCertificate(jwksUrl)

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

async function getCertificate(jwksUrl: string): Promise<string>{
  let cert: string = ''
  try {
    const response = await Axios.get(jwksUrl);
    const mykey = response['data']['keys'][0]['x5c'][0];
    cert = `-----BEGIN CERTIFICATE-----\n${mykey}\n-----END CERTIFICATE-----`;
  } catch (error){
    logger.error('Getting certificate failed', error)
  }
  return cert
}
