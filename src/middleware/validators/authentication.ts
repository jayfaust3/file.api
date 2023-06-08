import { JwtPayload, decode } from 'jsonwebtoken';
import logger from '../../logger';

export const authenticateFromHeader = async (header: string) => {
    if (header) {
        const authHeaderItems: Array<string> = header.split(/[ ]+/);

        if (authHeaderItems.length > 1) {
            const [authType, authValue] = authHeaderItems;

            const { GOOGLE_OAUTH_AUDIENCE, GOOGLE_OAUTH_ISSUER, SAINT_PORTAL_API_KEY } = process.env;

            switch(authType.trim().toLowerCase()) {
                case 'bearer':
                    try {
                        const { aud, exp, iss, scp } = decode(authValue) as JwtPayload

                        return Boolean(
                            aud === GOOGLE_OAUTH_AUDIENCE && 
                            [GOOGLE_OAUTH_ISSUER].includes(iss) && 
                            exp > Date.now() / 1000
                        );
                    } catch (err) {
                        logger.log({
                            level: 'error',
                            message: 'Unable to verify token',
                            error: err
                        });

                        return false;
                    }

                case 'apikey':
                    return [SAINT_PORTAL_API_KEY].includes(authValue);
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
};
