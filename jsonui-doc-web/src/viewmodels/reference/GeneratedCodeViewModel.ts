// ViewModel for Reference > Generated code.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { GeneratedCodeData } from "@/generated/data/GeneratedCodeData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class GeneratedCodeViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => GeneratedCodeData;
  protected _setData: (
    data: GeneratedCodeData | ((prev: GeneratedCodeData) => GeneratedCodeData),
  ) => void;

  get data(): GeneratedCodeData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => GeneratedCodeData,
    setData: (data: GeneratedCodeData | ((prev: GeneratedCodeData) => GeneratedCodeData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<GeneratedCodeData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<GeneratedCodeData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateReference: () => this.navigate("/reference"),
      onNavigateCliCommands: () => this.navigate("/reference/cli-commands"),
      onNavigatePlatformsSwift: () => this.navigate("/platforms/swift"),
      onNavigatePlatformsKotlin: () => this.navigate("/platforms/kotlin"),
    });
  };

  onAppear = () => {
    this.updateData({ nextReadLinks: this.asCollection(this.buildNextReads(this.sDefault)) });
  };

  mountLanguage = (): void => {
    this.updateData({ nextReadLinks: this.asCollection(this.buildNextReads(this.s)) });
  };

  private buildNextReads = (lookup: (key: string) => string): NextReadCell[] => [
    {
      id: "next_cli",
      titleKey: lookup("next_cli_title"),
      descriptionKey: lookup("next_cli_description"),
      url: "/reference/cli-commands",
      onNavigate: () => this.navigate("/reference/cli-commands"),
    },
    {
      id: "next_swift",
      titleKey: lookup("next_swift_title"),
      descriptionKey: lookup("next_swift_description"),
      url: "/platforms/swift",
      onNavigate: () => this.navigate("/platforms/swift"),
    },
    {
      id: "next_kotlin",
      titleKey: lookup("next_kotlin_title"),
      descriptionKey: lookup("next_kotlin_description"),
      url: "/platforms/kotlin",
      onNavigate: () => this.navigate("/platforms/kotlin"),
    },
  ];

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`reference_generated_code_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`reference_generated_code_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
