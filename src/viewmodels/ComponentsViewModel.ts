import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export class ComponentsViewModel {
  private router: AppRouterInstance;

  constructor(router: AppRouterInstance) {
    this.router = router;
  }

  get data() {
    return {
      onClickQuickStart: this.onClickQuickStart,
      onClickStyling: this.onClickStyling,
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

  // Navigation to other learn pages
  onClickQuickStart = () => {
    this.router.push("/learn/quick-start");
  };

  onClickStyling = () => {
    this.router.push("/learn/styling");
  };

  // Navigation to component detail pages (redirects to reference section)
  onClickViewDetail = () => {
    this.router.push("/reference/components/ref-view");
  };

  onClickScrollViewDetail = () => {
    this.router.push("/reference/components/ref-scroll-view");
  };

  onClickCollectionDetail = () => {
    this.router.push("/reference/components/ref-collection");
  };

  onClickLabelDetail = () => {
    this.router.push("/reference/components/ref-label");
  };

  onClickTextFieldDetail = () => {
    this.router.push("/reference/components/ref-text-field");
  };

  onClickTextViewDetail = () => {
    this.router.push("/reference/components/ref-text-view");
  };

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
