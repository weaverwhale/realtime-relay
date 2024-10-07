import chalk from 'chalk';

export class Logger {
  color: string;
  name: string;
  constructor() {
    this.color = 'FFFFFF';
    this.name = '';
  }
  setColor(hex: string) {
    this.color = hex;
  }
  setName(name: string) {
    this.name = name;
  }
  info(...message: string[]) {
    console.log(chalk.hex(this.color)(this.name), ' | ', ...message);
  }
  error(...message: string[]) {
    chalk.red(console.error(...message));
  }
}
const logger = new Logger();
export { logger };
