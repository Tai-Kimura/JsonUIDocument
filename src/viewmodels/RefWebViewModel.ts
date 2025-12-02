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

export class RefWebViewModel {
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

  get webAttributes(): RefAttributeData[] {
    return [
      { name: "url", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_web_url_desc") },
      { name: "html", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "string", description: StringManager.getString("ref_web_html_desc") },
      { name: "allowsBackForwardNavigationGestures", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "boolean", description: StringManager.getString("ref_web_allows_back_forward_desc") },
      { name: "allowsLinkPreview", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "boolean", description: StringManager.getString("ref_web_allows_link_preview_desc") },
      { name: "allowsInlineMediaPlayback", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "boolean", description: StringManager.getString("ref_web_allows_inline_media_desc") },
      { name: "isOpaque", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "boolean", description: StringManager.getString("ref_web_is_opaque_desc") },
      { name: "customUserAgent", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_web_custom_user_agent_desc") },
      { name: "javaScriptEnabled", uikit: true, swiftui: true, compose: false, xml: false, react: true, type: "boolean", description: StringManager.getString("ref_web_javascript_enabled_desc") },
      { name: "minimumFontSize", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "float", description: StringManager.getString("ref_web_minimum_font_size_desc") },
      { name: "dataDetectorTypes", uikit: true, swiftui: false, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_web_data_detector_types_desc"), isLast: true },
    ];
  }
}
