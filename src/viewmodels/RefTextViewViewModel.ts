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

export class RefTextViewViewModel {
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

  get textViewAttributes(): RefAttributeData[] {
    return [
      { name: "text", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_textview_attr_text_desc") },
      { name: "placeholder", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_textview_attr_placeholder_desc") },
      { name: "onChange", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_textview_attr_onchange_desc") },
      { name: "maxLength", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "integer", description: StringManager.getString("ref_textview_attr_maxlength_desc") },
      { name: "editable", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean", description: StringManager.getString("ref_textview_attr_editable_desc"), isLast: true }
    ];
  }
}
