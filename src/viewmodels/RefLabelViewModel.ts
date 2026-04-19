import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

interface PartialAttributeData {
  name: string;
  type: string;
  description: string;
  isLast?: boolean;
}

export class RefLabelViewModel {
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
      labelAttributes: this.labelAttributes,
      partialAttributes: this.partialAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get labelAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "text", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_label_attr_text_desc") },
      { name: "font", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_label_attr_font_desc") },
      { name: "fontSize", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "number | binding", description: StringManager.getString("ref_label_attr_fontsize_desc") },
      { name: "fontColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_label_attr_fontcolor_desc") },
      { name: "fontFamily", uikitStatus: N, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_label_attr_fontfamily_desc") },
      { name: "textAlign", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_label_attr_textalign_desc") },
      { name: "lines", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "number | binding", description: StringManager.getString("ref_label_attr_lines_desc") },
      { name: "lineHeight", uikitStatus: N, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "number", description: StringManager.getString("ref_label_attr_lineheight_desc") },
      { name: "lineHeightMultiple", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: N, type: "number | binding", description: StringManager.getString("ref_label_attr_lineheightmultiple_desc") },
      { name: "lineSpacing", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: N, type: "number | binding", description: StringManager.getString("ref_label_attr_linespacing_desc") },
      { name: "lineBreakMode", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_label_attr_linebreak_desc") },
      { name: "underline", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "boolean | object", description: StringManager.getString("ref_label_attr_underline_desc") },
      { name: "strikethrough", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "boolean | object", description: StringManager.getString("ref_label_attr_strikethrough_desc") },
      { name: "autoShrink", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: N, type: "boolean", description: StringManager.getString("ref_label_attr_autoshrink_desc") },
      { name: "minimumScaleFactor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: N, type: "number | binding", description: StringManager.getString("ref_label_attr_minimumscale_desc") },
      { name: "linkable", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: N, type: "boolean | binding", description: StringManager.getString("ref_label_attr_linkable_desc") },
      { name: "textShadow", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | object", description: StringManager.getString("ref_label_attr_textshadow_desc") },
      { name: "textTransform", uikitStatus: N, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_label_attr_texttransform_desc") },
      { name: "selected", uikitStatus: Y, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: N, type: "boolean | binding", description: StringManager.getString("ref_label_attr_selected_desc") },
      { name: "partialAttributes", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "array", description: StringManager.getString("ref_label_attr_partialattributes_desc") }
    ];
    // 最後以外にdividerVisibilityを設定
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }

  get partialAttributes(): PartialAttributeData[] {
    return [
      { name: "range", type: "object | array", description: StringManager.getString("ref_label_partial_attr_range_desc") },
      { name: "fontColor", type: "string", description: StringManager.getString("ref_label_partial_attr_fontcolor_desc") },
      { name: "fontSize", type: "float", description: StringManager.getString("ref_label_partial_attr_fontsize_desc") },
      { name: "fontWeight", type: "string", description: StringManager.getString("ref_label_partial_attr_fontweight_desc") },
      { name: "underline", type: "boolean", description: StringManager.getString("ref_label_partial_attr_underline_desc") },
      { name: "strikethrough", type: "boolean", description: StringManager.getString("ref_label_partial_attr_strikethrough_desc") },
      { name: "background", type: "string", description: StringManager.getString("ref_label_partial_attr_background_desc") },
      { name: "onclick", type: "string", description: StringManager.getString("ref_label_partial_attr_onclick_desc"), isLast: true }
    ];
  }
}
