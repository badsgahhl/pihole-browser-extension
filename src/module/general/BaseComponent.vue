<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import {i18nOptionsKeys, i18nPopupKeys, LinkConfig} from "../../service/browser/i18nService";
import {PiHoleSettingsDefaults, StorageService} from "../../service/browser/StorageService";
import ServiceLocator from "../../service/ServiceLocator";
import {TabService} from "../../service/browser/TabService";
import {BadgeService} from "../../service/browser/BadgeService";
import {PiHoleApiService} from "../../service/api/service/PiHoleApiService";

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
      return ServiceLocator.getInstance().get_i18n_service().translate(string, substitutions);
   }

   protected get_storage_service(): StorageService
   {
      return ServiceLocator.getInstance().get_storage_service();
   }

   protected get_tab_service(): TabService
   {
      return ServiceLocator.getInstance().get_tab_service();
   }

   protected get_badge_service(): BadgeService
   {
      return ServiceLocator.getInstance().get_badge_service();
   }

   protected get_api_service(): PiHoleApiService
   {
      return ServiceLocator.getInstance().get_api_service();
   }

}
</script>
