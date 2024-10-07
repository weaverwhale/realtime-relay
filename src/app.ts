import { RealtimeRelay } from './realtimeRelay';
import { logger } from './logger';

logger.info('Starting Realtime Relay');
const app = new RealtimeRelay();
app.listen();
logger.info('Realtime Relay started');
