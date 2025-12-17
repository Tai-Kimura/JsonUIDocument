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

export class RefImageViewModel {
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
      imageAttributes: this.imageAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get imageAttributes(): RefAttributeData[] {
    return [
      { name: "src", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_image_attr_src_desc") },
      { name: "contentMode", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_image_attr_contentmode_desc") },
      { name: "canTap", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "boolean", description: StringManager.getString("ref_image_attr_cantap_desc") },
      { name: "onclick", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_image_attr_onclick_desc"), isLast: true }
    ];
  }
}
