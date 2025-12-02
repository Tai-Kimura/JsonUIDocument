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

export class RefProgressViewModel {
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

  get progressAttributes(): RefAttributeData[] {
    return [
      { name: "progress", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "float/string", description: StringManager.getString("ref_progress_attr_progress_desc") },
      { name: "tintColor", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_progress_attr_tintcolor_desc") },
      { name: "progressTintColor", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_progress_attr_progresstintcolor_desc") },
      { name: "trackTintColor", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_progress_attr_tracktintcolor_desc") },
      { name: "progressViewStyle", uikit: true, swiftui: false, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_progress_attr_progressviewstyle_desc"), isLast: true }
    ];
  }
}
