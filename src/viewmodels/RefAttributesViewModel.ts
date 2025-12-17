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

export class RefAttributesViewModel {
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
      coreAttributes: this.coreAttributes,
      layoutAttributes: this.layoutAttributes,
      marginAttributes: this.marginAttributes,
      stylingAttributes: this.stylingAttributes,
      interactionAttributes: this.interactionAttributes,
      typographyAttributes: this.typographyAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get coreAttributes(): RefAttributeData[] {
    return [
      { name: "id", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("attr_id_desc") },
      { name: "type", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("attr_type_desc") },
      { name: "include", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("attr_include_desc") },
      { name: "style", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("attr_style_desc") },
      { name: "binding", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string | object", description: StringManager.getString("attr_binding_desc") },
      { name: "tag", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "integer", description: StringManager.getString("attr_tag_desc") },
      { name: "child", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "array", description: StringManager.getString("attr_child_desc"), isLast: true }
    ];
  }

  get layoutAttributes(): RefAttributeData[] {
    return [
      { name: "width", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float | string", description: StringManager.getString("attr_width_desc") },
      { name: "height", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float | string", description: StringManager.getString("attr_height_desc") },
      { name: "minWidth / maxWidth", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "float", description: StringManager.getString("attr_minmax_width_desc") },
      { name: "minHeight / maxHeight", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "float", description: StringManager.getString("attr_minmax_height_desc") },
      { name: "weight", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("attr_weight_desc") },
      { name: "orientation", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("attr_orientation_desc") },
      { name: "gravity", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("attr_gravity_desc") },
      { name: "direction", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "string", description: StringManager.getString("attr_direction_desc"), isLast: true }
    ];
  }

  get marginAttributes(): RefAttributeData[] {
    return [
      { name: "margins", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "array | float", description: StringManager.getString("attr_margins_desc") },
      { name: "leftMargin / rightMargin", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("attr_lr_margin_desc") },
      { name: "topMargin / bottomMargin", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("attr_tb_margin_desc") },
      { name: "padding", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "array | float", description: StringManager.getString("attr_padding_desc"), isLast: true }
    ];
  }

  get stylingAttributes(): RefAttributeData[] {
    return [
      { name: "background", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("attr_background_desc") },
      { name: "tapBackground", uikit: true, swiftui: true, compose: false, xml: true, react: false, type: "string", description: StringManager.getString("attr_tap_background_desc") },
      { name: "cornerRadius", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("attr_corner_radius_desc") },
      { name: "borderColor", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("attr_border_color_desc") },
      { name: "borderWidth", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("attr_border_width_desc") },
      { name: "alpha", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("attr_alpha_desc") },
      { name: "shadow", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string | object", description: StringManager.getString("attr_shadow_desc") },
      { name: "clipToBounds", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean", description: StringManager.getString("attr_clip_to_bounds_desc"), isLast: true }
    ];
  }

  get interactionAttributes(): RefAttributeData[] {
    return [
      { name: "visibility", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("attr_visibility_desc") },
      { name: "hidden", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean | string", description: StringManager.getString("attr_hidden_desc") },
      { name: "userInteractionEnabled", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "boolean", description: StringManager.getString("attr_user_interaction_desc") },
      { name: "onclick", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "string | array", description: StringManager.getString("attr_onclick_desc") },
      { name: "onClick", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("attr_on_click_desc") },
      { name: "onLongPress", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("attr_on_long_press_desc") },
      { name: "onPan / onPinch", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("attr_on_pan_pinch_desc") },
      { name: "canTap", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "boolean", description: StringManager.getString("attr_can_tap_desc"), isLast: true }
    ];
  }

  get typographyAttributes(): RefAttributeData[] {
    return [
      { name: "text", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("attr_text_desc") },
      { name: "font", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "string", description: StringManager.getString("attr_font_desc") },
      { name: "fontSize", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("attr_font_size_desc") },
      { name: "fontColor", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("attr_font_color_desc") },
      { name: "fontWeight", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("attr_font_weight_desc") },
      { name: "textAlign", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("attr_text_align_desc") },
      { name: "lines", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "integer", description: StringManager.getString("attr_lines_desc") },
      { name: "underline", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "boolean | object", description: StringManager.getString("attr_underline_desc") },
      { name: "strikethrough", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "boolean | object", description: StringManager.getString("attr_strikethrough_desc"), isLast: true }
    ];
  }
}
