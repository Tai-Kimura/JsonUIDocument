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

export class RefScrollViewViewModel {
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
      scrollViewAttributes: this.scrollViewAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get scrollViewAttributes(): RefAttributeData[] {
    return [
      { name: "orientation", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_scrollview_attr_orientation_desc") },
      { name: "showsIndicator", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "boolean", description: StringManager.getString("ref_scrollview_attr_showsindicator_desc") },
      { name: "bounces", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "boolean", description: StringManager.getString("ref_scrollview_attr_bounces_desc") },
      { name: "paging", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "boolean", description: StringManager.getString("ref_scrollview_attr_paging_desc"), isLast: true }
    ];
  }
}
