import { getSecret } from './secrets.js';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WebSocketServer } from 'ws';
import { logger } from './logger.js';

export class RealtimeRelay {
  private apiKey: string;
  private sockets: WeakMap<any, any>;
  private wss: WebSocketServer | null;

  constructor() {
    this.apiKey = getSecret('OPENAI_API_KEY');
    this.sockets = new WeakMap();
    this.wss = null;
  }

  listen(): void {
    this.wss = new WebSocketServer({ port: getSecret('PORT') });
    this.wss.on('connection', this.connectionHandler.bind(this));
    this.log(`Listening on ws://localhost:${getSecret('PORT')}`);
  }

  async connectionHandler(ws: any, req: any): Promise<void> {
    if (!req.url) {
      this.log('No URL provided, closing connection.');
      ws.close();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname !== '/') {
      this.log(`Invalid pathname: "${pathname}"`);
      ws.close();
      return;
    }

    // Instantiate new client
    this.log(`Connecting with key "${this.apiKey.slice(0, 3)}..."`);
    const client = new RealtimeClient({ apiKey: this.apiKey });

    // Relay: OpenAI Realtime API Event -> Browser Event
    client.realtime.on('server.*', (event: any) => {
      this.log(`Relaying "${event.type}" to Client`);
      ws.send(JSON.stringify(event));
    });
    client.realtime.on('close', () => ws.close());

    // Relay: Browser Event -> OpenAI Realtime API Event
    // We need to queue data waiting for the OpenAI connection
    const messageQueue: string[] = [];
    const messageHandler = (data: string) => {
      try {
        const event = JSON.parse(data);
        this.log(`Relaying "${event.type}" to OpenAI`);
        client.realtime.send(event.type, event);
      } catch (e: any) {
        console.error(e.message);
        this.log(`Error parsing event from client: ${data}`);
      }
    };
    ws.on('message', (data: string) => {
      if (!client.isConnected()) {
        messageQueue.push(data);
      } else {
        messageHandler(data);
      }
    });
    ws.on('close', () => client.disconnect());

    // Connect to OpenAI Realtime API
    try {
      this.log(`Connecting to OpenAI...`);
      await client.connect();
    } catch (e: any) {
      this.log(`Error connecting to OpenAI: ${e.message}`);
      ws.close();
      return;
    }
    this.log(`Connected to OpenAI successfully!`);
    while (messageQueue.length) {
      messageHandler(messageQueue.shift()!);
    }
  }

  log(...args: any[]): void {
    logger.info(`[RealtimeRelay]`, ...args);
  }
}
