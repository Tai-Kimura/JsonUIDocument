import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

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


  get iconLabelAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "text", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_icon_label_text_desc") },
      { name: "iconPosition", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_icon_label_icon_position_desc") },
      { name: "font", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: N, type: "string", description: StringManager.getString("ref_icon_label_font_desc") },
      { name: "fontSize", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "number", description: StringManager.getString("ref_icon_label_font_size_desc") },
      { name: "fontColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_icon_label_font_color_desc") },
      { name: "textShadow", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: N, type: "string | object", description: StringManager.getString("ref_icon_label_text_shadow_desc") },
      { name: "selectedFontColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: N, type: "string | binding", description: StringManager.getString("ref_icon_label_selected_font_color_desc") },
      { name: "icon_on", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_icon_label_icon_on_desc") },
      { name: "icon_off", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_icon_label_icon_off_desc") },
      { name: "iconMargin", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "number", description: StringManager.getString("ref_icon_label_icon_margin_desc") },
      { name: "iconSize", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "array | number", description: StringManager.getString("ref_icon_label_icon_size_desc") },
      { name: "onclick", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_icon_label_onclick_desc") },
      { name: "selected", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "boolean | binding", description: StringManager.getString("ref_icon_label_selected_desc") },
      { name: "enabled", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: N, type: "boolean | binding", description: StringManager.getString("ref_icon_label_enabled_desc") }
    ];
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }
}
