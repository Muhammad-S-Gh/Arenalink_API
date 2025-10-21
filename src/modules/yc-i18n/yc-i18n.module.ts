import { Global, Module } from '@nestjs/common';
import { YcI18nService } from './yc-i18n.service';

@Global()
@Module({
    providers: [YcI18nService],
    exports: [YcI18nService],
})
export class YcI18nModule {}
