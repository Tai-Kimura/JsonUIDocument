import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "../generated/StringManager";
import { RefAttributeRowData } from "../generated/data/RefAttributeRowData";

export class RefTableViewModel {
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
      tableAttributes: this.tableAttributes,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  get tableAttributes(): RefAttributeRowData[] {
    const Y = "✅";
    const N = "❌";
    const attrs = [
      { name: "separatorStyle", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "string", description: StringManager.getString("ref_table_attr_separatorstyle_desc") },
      { name: "separatorColor", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "string | binding", description: StringManager.getString("ref_table_attr_separatorcolor_desc") },
      { name: "rowHeight", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "number", description: StringManager.getString("ref_table_attr_rowheight_desc") },
      { name: "showsVerticalScrollIndicator", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "boolean", description: StringManager.getString("ref_table_attr_showsverticalscrollindicator_desc") },
      { name: "bounces", uikitStatus: Y, swiftuiStatus: Y, composeStatus: N, xmlStatus: N, reactStatus: N, type: "boolean", description: StringManager.getString("ref_table_attr_bounces_desc") },
      { name: "scrollEnabled", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: N, type: "boolean", description: StringManager.getString("ref_table_attr_scrollenabled_desc") },
      { name: "allowsSelection", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: N, type: "boolean", description: StringManager.getString("ref_table_attr_allowsselection_desc") },
      { name: "keyboardDismissMode", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: Y, reactStatus: N, type: "string", description: StringManager.getString("ref_table_attr_keyboarddismissmode_desc") },
      { name: "columnCount", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: Y, type: "integer", description: StringManager.getString("ref_table_attr_columncount_desc") },
      { name: "itemSpacing", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: Y, type: "number", description: StringManager.getString("ref_table_attr_itemspacing_desc") },
      { name: "items", uikitStatus: Y, swiftuiStatus: Y, composeStatus: Y, xmlStatus: N, reactStatus: Y, type: "binding", description: StringManager.getString("ref_table_attr_items_desc") }
    ];
    return attrs.map((attr, index) => ({
      ...attr,
      dividerVisibility: index < attrs.length - 1 ? "true" : undefined
    }));
  }
}
