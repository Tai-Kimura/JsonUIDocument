import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import StringManager from "@/generated/StringManager";

interface LanguageOption {
  value: string;
  text: string;
}

const languageLabels: Record<string, string> = {
  en: "English",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
};

export class HeaderViewModel {
  private router: AppRouterInstance;
  currentLanguage: string = "en";
  languageItems: LanguageOption[] = [];

  constructor(router: AppRouterInstance) {
    this.router = router;
    this.languageItems = StringManager.availableLanguages.map((code: string) => ({
      value: code,
      text: languageLabels[code] || code.toUpperCase(),
    }));

    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("jsonui-language");
      if (savedLang && StringManager.availableLanguages.includes(savedLang)) {
        this.currentLanguage = savedLang;
        StringManager.setLanguage(savedLang);
      } else {
        const browserLang = navigator.language.split("-")[0];
        if (StringManager.availableLanguages.includes(browserLang)) {
          this.currentLanguage = browserLang;
          StringManager.setLanguage(browserLang);
        }
      }
    }
  }

  get data() {
    return {
      onClickHome: this.onClickHome,
      onClickLearn: this.onClickLearn,
      onClickReference: this.onClickReference,
      onClickPlatforms: this.onClickPlatforms,
      onClickCLI: this.onClickCLI,
      onClickCommunity: this.onClickCommunity,
      onClickGitHub: this.onClickGitHub,
      currentLanguage: this.currentLanguage,
      languageItems: this.languageItems,
      onLanguageChange: this.onLanguageChange,
    };
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

  onClickCLI = () => {
    this.router.push("/cli");
  };

  onClickCommunity = () => {
    this.router.push("/community");
  };

  onClickGitHub = () => {
    window.open("https://github.com/Tai-Kimura/JsonUIDocument", "_blank");
  };

  onLanguageChange = (value: string) => {
    if (value === this.currentLanguage) return;
    this.currentLanguage = value;
    StringManager.setLanguage(value);
    localStorage.setItem("jsonui-language", value);
    setTimeout(() => window.location.reload(), 100);
  };
}
