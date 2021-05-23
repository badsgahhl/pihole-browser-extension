<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import {
  I18NOptionKeys, I18NPopupKeys, I18NService, LinkConfig,
} from '../../service/i18NService';
import { PiHoleSettingsDefaults } from '../../service/StorageService';

@Component
export default class BaseComponent extends Vue {
  // Translation Keys for the Options. Needed for the vue template
  protected i18nOptionsKeys = I18NOptionKeys;

  // Translation Keys for the Popup
  protected i18nPopupKeys = I18NPopupKeys;

  // Enum with some Links
  protected LinkConfig = LinkConfig;

  // Default Settings
  protected PiHoleSettingsDefaults = PiHoleSettingsDefaults;

  /**
   * Wrapper for translation
   */
  protected translate(string: string, substitutions?: Array<string | number>): string {
    return I18NService.translate(string, substitutions);
  }
}
</script>
