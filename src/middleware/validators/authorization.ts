import { JwtPayload, decode } from 'jsonwebtoken';
import logger from '../../logger';

export const authorizeFromHeader = async (header: string, authorizedScopes: Array<string>, allowApiKeyAccess?: boolean) => {
    const [authType, authValue] = header.split(/[ ]+/);
  
    switch (authType.trim().toLowerCase()) {
        case 'bearer':
            try {
                const { scp } = decode(authValue) as JwtPayload
    
                const scopesFromToken = (scp as string).split(' ')

                return authorizedScopes.some(authorizedScope => scopesFromToken.includes(authorizedScope))
            } catch (err) {
                logger.log({
                    level: 'error',
                    message: 'Unable to verify token',
                    error: err
                });
    
                return false;
            }

        case 'apikey':
            return Boolean(allowApiKeyAccess)
    }
};
