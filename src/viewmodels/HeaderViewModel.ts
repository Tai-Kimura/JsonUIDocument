import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export class HeaderViewModel {
  private router: AppRouterInstance;

  constructor(router: AppRouterInstance) {
    this.router = router;
  }

  onClickHome = () => {
    this.router.push("/");
  };

  onClickLearn = () => {
    this.router.push("/learn");
  };

  onClickReference = () => {
    this.router.push("/reference");
  };

  onClickPlatforms = () => {
    this.router.push("/platforms");
  };

  onClickCommunity = () => {
    // TODO: Add community page
    console.log("Community page coming soon");
  };

  onClickGitHub = () => {
    window.open("https://github.com/Tai-Kimura/JsonUIDocument", "_blank");
  };
}
