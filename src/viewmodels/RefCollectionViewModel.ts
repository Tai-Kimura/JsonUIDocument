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

export class RefCollectionViewModel {
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

  get collectionAttributes(): RefAttributeData[] {
    return [
      { name: "items", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "string", description: StringManager.getString("ref_collection_attr_items_desc") },
      { name: "cellClasses", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "array", description: StringManager.getString("ref_collection_attr_cellclasses_desc") },
      { name: "headerClasses", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "array", description: StringManager.getString("ref_collection_attr_headerclasses_desc") },
      { name: "columnCount", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "integer", description: StringManager.getString("ref_collection_attr_columncount_desc") },
      { name: "itemSpacing", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("ref_collection_attr_itemspacing_desc") },
      { name: "lineSpacing", uikit: true, swiftui: true, compose: true, xml: true, react: true, type: "float", description: StringManager.getString("ref_collection_attr_linespacing_desc"), isLast: true }
    ];
  }
}
