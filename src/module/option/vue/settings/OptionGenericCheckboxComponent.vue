<template>
   <b-form-group>
      <b-form-checkbox switch v-model:checked="is_checked">
         {{ translate(label_text_key) }}
      </b-form-checkbox>
   </b-form-group>

</template>

<script lang="ts">
import {Component, Prop, Watch} from 'vue-property-decorator';
import {i18nOptionsKeys} from "../../../../service/browser/i18nService";
import BaseComponent from "../../../general/BaseComponent.vue";

@Component
/**
 * Generic Component for a checkbox option
 **/
export default class OptionGenericCheckboxComponent extends BaseComponent
{
   // Label Text key
   @Prop()
   label_text_key!: i18nOptionsKeys;

   // Getter function to get the data from the storage
   @Prop()
   getter_function!: () => Promise<boolean>;

   // Setter function to save the data to the storage
   @Prop()
   setter_function!: (value: boolean) => void;

   @Watch('is_checked')
   private on_is_checked_changed(): void
   {
      this.setter_function(this.is_checked);
   }

   // Data Prop: is the checkbox checked?
   private is_checked: boolean = false;

   mounted()
   {
      this.update_status();
   }

   /**
    * Function to update the current status of the checkbox
    */
   private update_status(): void
   {
      this.getter_function().then(value => {
         if (typeof value === "undefined")
         {
            this.is_checked = false;
         }
         else
         {
            this.is_checked = value;
         }
      });
   }

}
</script>
