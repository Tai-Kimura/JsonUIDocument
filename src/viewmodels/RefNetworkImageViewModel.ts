import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

export class RefNetworkImageViewModel {
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
      networkImageAttributes: this.networkImageAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get networkImageAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "src", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_network_image_src_desc") },
      { name: "alt", uikitStatus: N, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_network_image_alt_desc") },
      { name: "defaultImage", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_network_image_default_image_desc") },
      { name: "errorImage", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_network_image_error_image_desc") },
      { name: "loadingImage", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: N, type: "string", description: StringManager.getString("ref_network_image_loading_image_desc") },
      { name: "contentMode", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_network_image_content_mode_desc") },
      { name: "onLoad", uikitStatus: N, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_network_image_onload_desc") },
      { name: "onError", uikitStatus: N, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string", description: StringManager.getString("ref_network_image_onerror_desc") },
      { name: "cachePolicy", uikitStatus: Y, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: N, type: "string", description: StringManager.getString("ref_network_image_cache_policy_desc") },
      { name: "timeout", uikitStatus: Y, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: N, type: "number", description: StringManager.getString("ref_network_image_timeout_desc") }
    ];
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }
}
