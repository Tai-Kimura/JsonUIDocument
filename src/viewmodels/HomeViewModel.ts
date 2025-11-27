import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export class HomeViewModel {
  private router: AppRouterInstance;

  constructor(router: AppRouterInstance) {
    this.router = router;
  }

  onClickGetStarted = () => {
    this.router.push("/learn");
  };

  onClickApiReference = () => {
    this.router.push("/reference");
  };
}
