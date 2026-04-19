import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export class HomeViewModel {
  private router: AppRouterInstance;

  constructor(router: AppRouterInstance) {
    this.router = router;
  }

  get data() {
    return {
      onClickGetStarted: this.onClickGetStarted,
      onClickApiReference: this.onClickApiReference,
      onClickSwiftRepo: this.onClickSwiftRepo,
      onClickKotlinRepo: this.onClickKotlinRepo,
      onClickReactRepo: this.onClickReactRepo,
    };
  }

  onClickGetStarted = () => {
    this.router.push("/learn");
  };

  onClickApiReference = () => {
    this.router.push("/reference");
  };

  onClickSwiftRepo = () => {
    window.open("https://github.com/anthropics/swiftjsonui", "_blank");
  };

  onClickKotlinRepo = () => {
    window.open("https://github.com/anthropics/kotlinjsonui", "_blank");
  };

  onClickReactRepo = () => {
    window.open("https://github.com/anthropics/reactjsonui", "_blank");
  };
}
