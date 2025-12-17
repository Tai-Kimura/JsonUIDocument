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

export class RefIconLabelViewModel {
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
      iconLabelAttributes: this.iconLabelAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get iconLabelAttributes(): RefAttributeData[] {
    return [
      { name: "text", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_icon_label_text_desc") },
      { name: "iconPosition", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_icon_label_icon_position_desc") },
      { name: "font", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_icon_label_font_desc") },
      { name: "fontSize", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "float", description: StringManager.getString("ref_icon_label_font_size_desc") },
      { name: "fontColor", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_icon_label_font_color_desc") },
      { name: "textShadow", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_icon_label_text_shadow_desc") },
      { name: "selectedFontColor", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_icon_label_selected_font_color_desc") },
      { name: "icon_on", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_icon_label_icon_on_desc") },
      { name: "icon_off", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_icon_label_icon_off_desc") },
      { name: "iconMargin", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "float", description: StringManager.getString("ref_icon_label_icon_margin_desc") },
      { name: "iconSize", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "array", description: StringManager.getString("ref_icon_label_icon_size_desc") },
      { name: "onclick", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_icon_label_onclick_desc") },
      { name: "selected", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "boolean/string", description: StringManager.getString("ref_icon_label_selected_desc") },
      { name: "enabled", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "boolean/string", description: StringManager.getString("ref_icon_label_enabled_desc"), isLast: true },
    ];
  }
}
