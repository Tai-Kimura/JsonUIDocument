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


  get buttonAttributes(): RefAttributeData[] {
    return [
      { name: "text", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_button_attr_text_desc") },
      { name: "onclick", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_button_attr_onclick_desc") },
      { name: "onClick", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_button_attr_onClick_desc") },
      { name: "enabled", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean", description: StringManager.getString("ref_button_attr_enabled_desc") },
      { name: "fontSize", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("ref_button_attr_fontsize_desc") },
      { name: "fontColor", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_button_attr_fontcolor_desc") },
      { name: "fontWeight", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_button_attr_fontweight_desc") },
      { name: "background", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_button_attr_background_desc") },
      { name: "cornerRadius", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("ref_button_attr_cornerradius_desc") },
      { name: "borderWidth", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("ref_button_attr_borderwidth_desc") },
      { name: "borderColor", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_button_attr_bordercolor_desc"), isLast: true }
    ];
  }
}
