<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import {i18nOptionsKeys, i18nPopupKeys, i18nService, LinkConfig} from "../../service/i18nService";
import {PiHoleSettingsDefaults} from "../../service/StorageService";

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
    return i18nService.translate(string, substitutions);
  }

}
</script>
