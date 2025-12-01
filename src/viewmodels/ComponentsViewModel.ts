import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export class ComponentsViewModel {
  private router: AppRouterInstance;

  constructor(router: AppRouterInstance) {
    this.router = router;
  }

  // Navigation to other learn pages
  onClickQuickStart = () => {
    this.router.push("/learn/quick-start");
  };

  onClickStyling = () => {
    this.router.push("/learn/styling");
  };

  // Navigation to component detail pages
  onClickViewDetail = () => {
    this.router.push("/learn/components/view-detail");
  };

  onClickScrollViewDetail = () => {
    this.router.push("/learn/components/scroll-view-detail");
  };

  onClickCollectionDetail = () => {
    this.router.push("/learn/components/collection-detail");
  };

  onClickLabelDetail = () => {
    this.router.push("/learn/components/label-detail");
  };

  onClickTextFieldDetail = () => {
    this.router.push("/learn/components/text-field-detail");
  };

  onClickTextViewDetail = () => {
    this.router.push("/learn/components/text-view-detail");
  };

  onClickButtonDetail = () => {
    this.router.push("/learn/components/button-detail");
  };

  onClickSwitchDetail = () => {
    this.router.push("/learn/components/switch-detail");
  };

  onClickSliderDetail = () => {
    this.router.push("/learn/components/slider-detail");
  };
}
