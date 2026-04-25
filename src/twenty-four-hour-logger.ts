import { ConsoleLogger } from '@nestjs/common';

/**
 * A ConsoleLogger that always renders timestamps in 24-hour format,
 * regardless of the host system locale. The default NestJS ConsoleLogger
 * relies on the system locale, which on some hosts produces AM/PM.
 */
export class TwentyFourHourLogger extends ConsoleLogger {
   protected getTimestamp(): string {
      const now = new Date();

      // Use a locale that uses 24-hour time and explicitly disable hour12.
      return now.toLocaleString('nl-NL', {
         year: 'numeric',
         month: '2-digit',
         day: '2-digit',
         hour: '2-digit',
         minute: '2-digit',
         second: '2-digit',
         hour12: false,
      });
   }
}