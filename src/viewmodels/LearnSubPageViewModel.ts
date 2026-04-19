import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export class LearnSubPageViewModel {
  private router: AppRouterInstance;

  constructor(router: AppRouterInstance) {
    this.router = router;
  }

  get data() {
    return {
      onClickInstallation: this.onClickInstallation,
      onClickQuickStart: this.onClickQuickStart,
      onClickComponents: this.onClickComponents,
      onClickStyling: this.onClickStyling,
      onClickDataBinding: this.onClickDataBinding,
      onClickLearn: this.onClickLearn,
    };
  }

  onClickInstallation = () => {
    this.router.push("/learn/installation");
  };

  onClickQuickStart = () => {
    this.router.push("/learn/quick-start");
  };

  onClickComponents = () => {
    this.router.push("/learn/components");
  };

  onClickStyling = () => {
    this.router.push("/learn/styling");
  };

  onClickDataBinding = () => {
    this.router.push("/learn/data-binding");
  };

  onClickLearn = () => {
    this.router.push("/learn");
  };
}
