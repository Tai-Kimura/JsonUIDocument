export class CommunityViewModel {
  constructor() {}

  get data() {
    return {
      onClickGitHub: this.onClickGitHub,
      onClickDiscussions: this.onClickDiscussions,
    };
  }

  onClickGitHub = () => {
    window.open("https://github.com/Tai-Kimura/SwiftJsonUI", "_blank");
  };

  onClickDiscussions = () => {
    window.open("https://github.com/Tai-Kimura/SwiftJsonUI/discussions", "_blank");
  };
}
