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

export class RefTableViewModel {
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

  get tableAttributes(): RefAttributeData[] {
    return [
      { name: "separatorStyle", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_table_attr_separatorstyle_desc") },
      { name: "separatorColor", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "string", description: StringManager.getString("ref_table_attr_separatorcolor_desc") },
      { name: "rowHeight", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "float", description: StringManager.getString("ref_table_attr_rowheight_desc") },
      { name: "showsVerticalScrollIndicator", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "boolean", description: StringManager.getString("ref_table_attr_showsverticalscrollindicator_desc") },
      { name: "bounces", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "boolean", description: StringManager.getString("ref_table_attr_bounces_desc") },
      { name: "scrollEnabled", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "boolean", description: StringManager.getString("ref_table_attr_scrollenabled_desc") },
      { name: "allowsSelection", uikit: true, swiftui: true, compose: true, xml: false, react: false, type: "boolean", description: StringManager.getString("ref_table_attr_allowsselection_desc") },
      { name: "keyboardDismissMode", uikit: true, swiftui: true, compose: true, xml: true, react: false, type: "string", description: StringManager.getString("ref_table_attr_keyboarddismissmode_desc") },
      { name: "columnCount", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "integer", description: StringManager.getString("ref_table_attr_columncount_desc") },
      { name: "itemSpacing", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "float", description: StringManager.getString("ref_table_attr_itemspacing_desc") },
      { name: "items", uikit: true, swiftui: true, compose: true, xml: false, react: true, type: "string", description: StringManager.getString("ref_table_attr_items_desc"), isLast: true }
    ];
  }
}
