import { RealtimeRelay } from './realtimeRelay.js';
import { logger } from './logger.js';

logger.info('Starting Realtime Relay');
const app = new RealtimeRelay();
app.listen();
logger.info('Realtime Relay started');
