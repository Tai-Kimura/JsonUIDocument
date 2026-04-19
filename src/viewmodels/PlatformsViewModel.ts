export class PlatformsViewModel {
  constructor() {}

  get data() {
    return {
      onClickSwiftDocs: this.onClickSwiftDocs,
      onClickSwiftGitHub: this.onClickSwiftGitHub,
      onClickKotlinDocs: this.onClickKotlinDocs,
      onClickKotlinGitHub: this.onClickKotlinGitHub,
      onClickReactDocs: this.onClickReactDocs,
      onClickReactGitHub: this.onClickReactGitHub,
    };
  }

  // SwiftJsonUI
  onClickSwiftDocs = () => {
    window.open("https://github.com/Tai-Kimura/SwiftJsonUI#readme", "_blank");
  };

  onClickSwiftGitHub = () => {
    window.open("https://github.com/Tai-Kimura/SwiftJsonUI", "_blank");
  };

  // KotlinJsonUI
  onClickKotlinDocs = () => {
    window.open("https://github.com/Tai-Kimura/KotlinJsonUI#readme", "_blank");
  };

  onClickKotlinGitHub = () => {
    window.open("https://github.com/Tai-Kimura/KotlinJsonUI", "_blank");
  };

  // ReactJsonUI
  onClickReactDocs = () => {
    window.open("https://github.com/Tai-Kimura/ReactJsonUI#readme", "_blank");
  };

  onClickReactGitHub = () => {
    window.open("https://github.com/Tai-Kimura/ReactJsonUI", "_blank");
  };
}
