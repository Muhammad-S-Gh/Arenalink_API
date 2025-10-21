import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n/dist';
import { I18nPath, I18nTranslations } from '../../shared/types/i18n.generated';

export type SupportedLang = 'en' | 'ar';
export const defaultLang: SupportedLang = 'en';

@Injectable()
export class YcI18nService {
    // I18nService<I18nTranslations> this tells the I18nService exactly which translation keys are valid.
    // I18nPath only safeguards the key string.
    // The generic on the service ensures the entire translation call (key + options) matches your translation structure.
    constructor(private readonly i18n: I18nService<I18nTranslations>) {}
    t(key: I18nPath, options?: Record<string, any>) {
        const lang = I18nContext.current()?.lang;
        return this.i18n.translate(key, { lang, ...options });
    }

    lang(): SupportedLang {
        return (I18nContext.current()?.lang || defaultLang) as SupportedLang;
    }
}
