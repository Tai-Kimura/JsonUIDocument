import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export class FooterViewModel {
  private router: AppRouterInstance;

  constructor(router: AppRouterInstance) {
    this.router = router;
  }

  get data() {
    return {
      onClickGettingStarted: this.onClickGettingStarted,
      onClickQuickStart: this.onClickQuickStart,
      onClickJsonBasics: this.onClickJsonBasics,
      onClickRefComponents: this.onClickRefComponents,
      onClickRefAttributes: this.onClickRefAttributes,
      onClickRefDataBinding: this.onClickRefDataBinding,
      onClickSwift: this.onClickSwift,
      onClickKotlin: this.onClickKotlin,
      onClickReact: this.onClickReact,
      onClickGitHub: this.onClickGitHub,
      onClickIssues: this.onClickIssues,
      onClickDiscussions: this.onClickDiscussions,
    };
  }

  // Learn section
  onClickGettingStarted = () => {
    this.router.push("/learn");
  };

  onClickQuickStart = () => {
    this.router.push("/learn/quick-start");
  };

  onClickJsonBasics = () => {
    this.router.push("/learn/components");
  };

  // Reference section
  onClickRefComponents = () => {
    this.router.push("/reference/components");
  };

  onClickRefAttributes = () => {
    this.router.push("/reference/attributes");
  };

  onClickRefDataBinding = () => {
    this.router.push("/reference/data-binding");
  };

  // Platforms section
  onClickSwift = () => {
    window.open("https://github.com/Tai-Kimura/SwiftJsonUI", "_blank");
  };

  onClickKotlin = () => {
    window.open("https://github.com/aspect-apps/KotlinJsonUI", "_blank");
  };

  onClickReact = () => {
    window.open("https://github.com/Tai-Kimura/ReactJsonUI", "_blank");
  };

  // Community section
  onClickGitHub = () => {
    window.open("https://github.com/Tai-Kimura/SwiftJsonUI", "_blank");
  };

  onClickIssues = () => {
    window.open("https://github.com/Tai-Kimura/SwiftJsonUI/issues", "_blank");
  };

  onClickDiscussions = () => {
    window.open("https://github.com/Tai-Kimura/SwiftJsonUI/discussions", "_blank");
  };
}
