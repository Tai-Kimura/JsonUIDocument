import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

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


  get imageAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "src", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_image_attr_src_desc") },
      { name: "srcName", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_image_attr_srcname_desc") },
      { name: "contentMode", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_image_attr_contentmode_desc") },
      { name: "tintColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_image_attr_tintcolor_desc") },
      { name: "canTap", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: N, type: "boolean", description: StringManager.getString("ref_image_attr_cantap_desc") },
      { name: "onclick", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: Y, type: "string", description: StringManager.getString("ref_image_attr_onclick_desc") }
    ];
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }
}
