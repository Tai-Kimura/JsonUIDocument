import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export class RefComponentsViewModel {
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
      onClickViewDetail: this.onClickViewDetail,
      onClickScrollViewDetail: this.onClickScrollViewDetail,
      onClickCollectionDetail: this.onClickCollectionDetail,
      onClickLabelDetail: this.onClickLabelDetail,
      onClickTextFieldDetail: this.onClickTextFieldDetail,
      onClickTextViewDetail: this.onClickTextViewDetail,
      onClickButtonDetail: this.onClickButtonDetail,
      onClickSwitchDetail: this.onClickSwitchDetail,
      onClickSliderDetail: this.onClickSliderDetail,
      onClickSelectBoxDetail: this.onClickSelectBoxDetail,
      onClickRadioDetail: this.onClickRadioDetail,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };


  // Layout components - using same method names as ComponentsViewModel for shared components
  onClickViewDetail = () => {
    this.router.push("/reference/components/ref-view");
  };

  onClickScrollViewDetail = () => {
    this.router.push("/reference/components/ref-scroll-view");
  };

  onClickCollectionDetail = () => {
    this.router.push("/reference/components/ref-collection");
  };

  // Text components
  onClickLabelDetail = () => {
    this.router.push("/reference/components/ref-label");
  };

  onClickTextFieldDetail = () => {
    this.router.push("/reference/components/ref-text-field");
  };

  onClickTextViewDetail = () => {
    this.router.push("/reference/components/ref-text-view");
  };

  // Input components
  onClickButtonDetail = () => {
    this.router.push("/reference/components/ref-button");
  };

  onClickSwitchDetail = () => {
    this.router.push("/reference/components/ref-switch");
  };

  onClickSliderDetail = () => {
    this.router.push("/reference/components/ref-slider");
  };

  onClickSelectBoxDetail = () => {
    this.router.push("/reference/components/ref-select-box");
  };

  onClickRadioDetail = () => {
    this.router.push("/reference/components/ref-radio");
  };
}
