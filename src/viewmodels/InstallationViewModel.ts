import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export class InstallationViewModel {
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

  get data() {
    return {
      currentTab: this._currentTab,
      setCurrentTab: this._setCurrentTab,
      onTabChange: this.onTabChange,
      onClickQuickStart: this.onClickQuickStart,
      onClickLearn: this.onClickLearn,
      // Tab visibility
      showSwiftContent: this._currentTab === 0,
      showKotlinContent: this._currentTab === 1,
      showReactContent: this._currentTab === 2,
    };
  }

  get currentTab(): number {
    return this._currentTab;
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };

  onClickQuickStart = () => {
    this.router.push("/learn/quick-start");
  };

  onClickLearn = () => {
    this.router.push("/learn");
  };
}
