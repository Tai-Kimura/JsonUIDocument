import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

export class RefWebViewModel {
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
      webAttributes: this.webAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get webAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "url", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_web_url_desc") },
      { name: "html", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "string | binding", description: StringManager.getString("ref_web_html_desc") },
      { name: "allowsBackForwardNavigationGestures", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: N, type: "boolean", description: StringManager.getString("ref_web_allows_back_forward_desc") },
      { name: "allowsLinkPreview", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: N, type: "boolean", description: StringManager.getString("ref_web_allows_link_preview_desc") },
      { name: "allowsInlineMediaPlayback", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "boolean", description: StringManager.getString("ref_web_allows_inline_media_desc") },
      { name: "isOpaque", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: N, type: "boolean", description: StringManager.getString("ref_web_is_opaque_desc") },
      { name: "customUserAgent", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: N, type: "string", description: StringManager.getString("ref_web_custom_user_agent_desc") },
      { name: "javaScriptEnabled", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: Y, type: "boolean", description: StringManager.getString("ref_web_javascript_enabled_desc") },
      { name: "minimumFontSize", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: N, type: "number", description: StringManager.getString("ref_web_minimum_font_size_desc") },
      { name: "dataDetectorTypes", uikitStatus: Y, swiftuiStatus: N, composeStatus: N, xmlStatus: N, reactStatus: N, type: "string", description: StringManager.getString("ref_web_data_detector_types_desc") }
    ];
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }
}
