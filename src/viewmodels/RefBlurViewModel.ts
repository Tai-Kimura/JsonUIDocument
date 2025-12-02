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

export class RefBlurViewModel {
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

  get blurAttributes(): RefAttributeData[] {
    return [
      { name: "effectStyle", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_blur_effect_style_desc") },
      { name: "intensity", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "float", description: StringManager.getString("ref_blur_intensity_desc") },
      { name: "vibrancy", uikit: true, swiftui: false, compose: false, xml: false, react: false, type: "boolean", description: StringManager.getString("ref_blur_vibrancy_desc") },
      { name: "onclick", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_blur_onclick_desc"), isLast: true },
    ];
  }
}
