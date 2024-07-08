import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import * as localeEN from '../../assets/i18n/en.json';
import * as localeDE from '../../assets/i18n/de.json';

const Locales = {
  en: localeEN,
  de: localeDE
};

export class TranslationLoader implements TranslateLoader {
  getTranslation(lang: 'en' | 'de'): Observable<any> {
    return of(Locales[lang]);
  }
}