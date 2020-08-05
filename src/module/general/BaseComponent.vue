<script lang="ts">
import Vue from "vue";
import {Component} from "vue-property-decorator";
import {i18nOptionsKeys, i18nPopupKeys, i18nService, LinkConfig} from "../../service/browser/i18nService";
import {PiHoleSettingsDefaults, StorageService} from "../../service/browser/StorageService";

@Component
export default class BaseComponent extends Vue
{
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
    * @param string
    * @param substitutions
    */
   protected translate(string: string, substitutions?: any): string
   {
      return i18nService.translate(string, substitutions);
   }

   protected get_storage_service(): StorageService
   {
      return StorageService.getInstance();
   }

}
</script>
