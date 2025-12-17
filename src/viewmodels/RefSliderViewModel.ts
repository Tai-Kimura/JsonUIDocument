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

export class RefSliderViewModel {
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
      sliderAttributes: this.sliderAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get sliderAttributes(): RefAttributeData[] {
    return [
      { name: "value", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("ref_slider_attr_value_desc") },
      { name: "min", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("ref_slider_attr_min_desc") },
      { name: "max", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("ref_slider_attr_max_desc") },
      { name: "step", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("ref_slider_attr_step_desc") },
      { name: "onChange", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_slider_attr_onchange_desc") },
      { name: "thumbColor", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "string", description: StringManager.getString("ref_slider_attr_thumbcolor_desc") },
      { name: "trackColor", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "string", description: StringManager.getString("ref_slider_attr_trackcolor_desc"), isLast: true }
    ];
  }
}
