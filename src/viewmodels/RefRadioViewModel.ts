import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";

interface RefAttributeData {
  name: string;
  uikit: boolean;
  swiftui: boolean;
  compose: boolean;
  xml: boolean;
  react: boolean;
  type: string;
  description: string;
  isLast?: boolean;
}

export class RefRadioViewModel {
  private router: AppRouterInstance;
  private _currentTab: number;
  private _setCurrentTab: (tab: number) => void;

  constructor(
    router: AppRouterInstance,
    currentTab: number,
    setCurrentTab: (tab: number) => void) {
    this.router = router;
    this._currentTab = currentTab;
    this._setCurrentTab = setCurrentTab;
  }

  get currentTab(): number {
    return this._currentTab;
  }


  get data() {
    return {
      currentTab: this._currentTab,
      setCurrentTab: this._setCurrentTab,
      onTabChange: this.onTabChange,
      radioAttributes: this.radioAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get radioAttributes(): RefAttributeData[] {
    return [
      { name: "text", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "string", description: StringManager.getString("ref_radio_attr_text_desc") },
      { name: "group", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_radio_attr_group_desc") },
      { name: "checked", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "boolean/string", description: StringManager.getString("ref_radio_attr_checked_desc") },
      { name: "value", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "any", description: StringManager.getString("ref_radio_attr_value_desc") },
      { name: "icon", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_radio_attr_icon_desc") },
      { name: "selected_icon", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_radio_attr_selectedicon_desc") },
      { name: "tintColor", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_radio_attr_tintcolor_desc") },
      { name: "spacing", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "float", description: StringManager.getString("ref_radio_attr_spacing_desc") },
      { name: "onclick", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_radio_attr_onclick_desc") },
      { name: "enabled", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "boolean/string", description: StringManager.getString("ref_radio_attr_enabled_desc"), isLast: true }
    ];
  }
}
