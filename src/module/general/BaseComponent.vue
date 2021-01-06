<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import {i18nOptionsKeys, i18nPopupKeys, I18nService, LinkConfig} from "../../service/browser/I18nService";
import {PiHoleSettingsDefaults} from "../../service/browser/StorageService";

@Component
export default class BaseComponent extends Vue {
  // Translation Keys for the Options. Needed for the vue template
  protected i18nOptionsKeys = i18nOptionsKeys;

  // Translation Keys for the Popup
  protected i18nPopupKeys = i18nPopupKeys;

  // Enum with some Links
  protected LinkConfig = LinkConfig;

  // Default Settings
  protected PiHoleSettingsDefaults = PiHoleSettingsDefaults;

  /**
   * Wrapper for translation
   */
  protected translate(string: string, substitutions?: any): string {
    return I18nService.translate(string, substitutions);
  }

}
</script>
