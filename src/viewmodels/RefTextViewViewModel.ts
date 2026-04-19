import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

export class RefTextViewViewModel {
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
      textViewAttributes: this.textViewAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get textViewAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "text", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_textview_attr_text_desc") },
      { name: "hint", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_textview_attr_hint_desc") },
      { name: "placeholder", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_textview_attr_placeholder_desc") },
      { name: "hintColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_textview_attr_hintcolor_desc") },
      { name: "font", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_textview_attr_font_desc") },
      { name: "fontSize", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "number | binding", description: StringManager.getString("ref_textview_attr_fontsize_desc") },
      { name: "fontColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_textview_attr_fontcolor_desc") },
      { name: "textAlign", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_textview_attr_textalign_desc") },
      { name: "containerInset", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "number | array", description: StringManager.getString("ref_textview_attr_containerinset_desc") },
      { name: "flexible", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "boolean", description: StringManager.getString("ref_textview_attr_flexible_desc") },
      { name: "input", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_textview_attr_input_desc") },
      { name: "returnKeyType", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_textview_attr_returnkeytype_desc") },
      { name: "editable", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "boolean", description: StringManager.getString("ref_textview_attr_editable_desc") },
      { name: "scrollEnabled", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "boolean", description: StringManager.getString("ref_textview_attr_scrollenabled_desc") },
      { name: "onTextChange", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_textview_attr_ontextchange_desc") },
      { name: "rows", uikitStatus: N, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "number", description: StringManager.getString("ref_textview_attr_rows_desc") }
    ];
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }
}
