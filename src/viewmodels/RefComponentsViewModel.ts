import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export class RefComponentsViewModel {
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

  // Layout components
  goToView = () => {
    this.router.push("/reference/components/ref-view");
  };

  goToScrollView = () => {
    this.router.push("/reference/components/ref-scroll-view");
  };

  goToCollection = () => {
    this.router.push("/reference/components/ref-collection");
  };

  // Text components
  goToLabel = () => {
    this.router.push("/reference/components/ref-label");
  };

  goToTextField = () => {
    this.router.push("/reference/components/ref-text-field");
  };

  goToTextView = () => {
    this.router.push("/reference/components/ref-text-view");
  };

  // Input components
  goToButton = () => {
    this.router.push("/reference/components/ref-button");
  };

  goToSwitch = () => {
    this.router.push("/reference/components/ref-switch");
  };

  goToSlider = () => {
    this.router.push("/reference/components/ref-slider");
  };
}
