import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

export class RefButtonViewModel {
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
      buttonAttributes: this.buttonAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get buttonAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "text", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_button_attr_text_desc") },
      { name: "font", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_button_attr_font_desc") },
      { name: "fontSize", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "number", description: StringManager.getString("ref_button_attr_fontsize_desc") },
      { name: "fontColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_button_attr_fontcolor_desc") },
      { name: "disabledFontColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_button_attr_disabledfontcolor_desc") },
      { name: "highlightColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_button_attr_highlightcolor_desc") },
      { name: "tapBackground", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_button_attr_tapbackground_desc") },
      { name: "highlightBackground", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_button_attr_highlightbackground_desc") },
      { name: "image", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_button_attr_image_desc") },
      { name: "textAlign", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_button_attr_textalign_desc") },
      { name: "config", uikitStatus: Y, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: N, type: "object", description: StringManager.getString("ref_button_attr_config_desc") },
      { name: "buttonType", uikitStatus: N, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_button_attr_buttontype_desc") }
    ];
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }
}
