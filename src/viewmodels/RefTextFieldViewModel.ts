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

export class RefTextFieldViewModel {
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
      textFieldAttributes: this.textFieldAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get textFieldAttributes(): RefAttributeData[] {
    return [
      { name: "text", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_textfield_attr_text_desc") },
      { name: "placeholder", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_textfield_attr_placeholder_desc") },
      { name: "keyboardType", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "string", description: StringManager.getString("ref_textfield_attr_keyboardtype_desc") },
      { name: "secure", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "boolean", description: StringManager.getString("ref_textfield_attr_secure_desc") },
      { name: "onChange", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_textfield_attr_onchange_desc") },
      { name: "maxLength", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "integer", description: StringManager.getString("ref_textfield_attr_maxlength_desc") },
      { name: "autocorrect", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "boolean", description: StringManager.getString("ref_textfield_attr_autocorrect_desc") },
      { name: "autocapitalize", uikit: true, swiftui: true, compose: false, xml: false, react: false, type: "string", description: StringManager.getString("ref_textfield_attr_autocapitalize_desc"), isLast: true }
    ];
  }
}
