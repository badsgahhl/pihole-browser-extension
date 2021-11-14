import {
  I18NOptionKeys,
  I18NPopupKeys,
  I18NService,
  LinkConfig
} from '../service/i18NService'
import { PiHoleSettingsDefaults } from '../service/StorageService'

export default function useTranslation() {
  return {
    I18NPopupKeys,
    I18NOptionKeys,
    PiHoleSettingsDefaults,
    LinkConfig,
    translate: I18NService.translate
  }
}
