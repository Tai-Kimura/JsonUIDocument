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
    setCurrentTab: (tab: number) => void
  ) {
    this.router = router;
    this._currentTab = currentTab;
    this._setCurrentTab = setCurrentTab;
  }

  get currentTab(): number {
    return this._currentTab;
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };

  get labelAttributes(): RefAttributeData[] {
    return [
      { name: "text", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_label_attr_text_desc") },
      { name: "font", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "string", description: StringManager.getString("ref_label_attr_font_desc") },
      { name: "fontSize", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("ref_label_attr_fontsize_desc") },
      { name: "fontColor", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_label_attr_fontcolor_desc") },
      { name: "fontWeight", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_label_attr_fontweight_desc") },
      { name: "textAlign", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_label_attr_textalign_desc") },
      { name: "lines", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "integer", description: StringManager.getString("ref_label_attr_lines_desc") },
      { name: "lineHeight", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("ref_label_attr_lineheight_desc") },
      { name: "underline", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "boolean | object", description: StringManager.getString("ref_label_attr_underline_desc") },
      { name: "strikethrough", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "boolean | object", description: StringManager.getString("ref_label_attr_strikethrough_desc") },
      { name: "letterSpacing", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "float", description: StringManager.getString("ref_label_attr_letterspacing_desc") },
      { name: "lineBreakMode", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "string", description: StringManager.getString("ref_label_attr_linebreak_desc"), isLast: true }
    ];
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
