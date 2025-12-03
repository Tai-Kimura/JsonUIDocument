import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { StringManager } from "@/generated/StringManager";

interface IncludeAttributeData {
  name: string;
  type: string;
  description: string;
}

const t = (key: string): string => {
  return (StringManager.currentLanguage as Record<string, string>)[key] || key;
};

export class RefIncludeViewModel {
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

  get includeAttributes(): IncludeAttributeData[] {
    return [
      { name: "include", type: "string", description: t("ref_include_attr_include_desc") },
      { name: "data", type: "object", description: t("ref_include_attr_data_desc") },
      { name: "shared_data", type: "object", description: t("ref_include_attr_shared_data_desc") },
      { name: "binding_id", type: "string", description: t("ref_include_attr_binding_id_desc") }
    ];
  }
}
