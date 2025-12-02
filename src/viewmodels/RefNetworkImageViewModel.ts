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

export class RefNetworkImageViewModel {
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

  get networkImageAttributes(): RefAttributeData[] {
    return [
      { name: "src", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_network_image_src_desc") },
      { name: "defaultImage", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_network_image_default_image_desc") },
      { name: "errorImage", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_network_image_error_image_desc") },
      { name: "loadingImage", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_network_image_loading_image_desc") },
      { name: "contentMode", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_network_image_content_mode_desc") },
      { name: "cachePolicy", uikit: true, swiftui: false, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_network_image_cache_policy_desc") },
      { name: "timeout", uikit: true, swiftui: false, compose: false, xml: false, react: false, type: "float", description: StringManager.getString("ref_network_image_timeout_desc"), isLast: true },
    ];
  }
}
