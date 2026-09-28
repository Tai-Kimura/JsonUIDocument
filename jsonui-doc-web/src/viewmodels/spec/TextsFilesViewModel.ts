// ViewModel for Spec > Long prose: texts files.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { TextsFilesData } from "@/generated/data/TextsFilesData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class TextsFilesViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => TextsFilesData;
  protected _setData: (
    data: TextsFilesData | ((prev: TextsFilesData) => TextsFilesData),
  ) => void;

  get data(): TextsFilesData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => TextsFilesData,
    setData: (data: TextsFilesData | ((prev: TextsFilesData) => TextsFilesData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<TextsFilesData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<TextsFilesData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateSpec: () => this.navigate("/spec"),
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
        id: "next_anatomy",
        titleKey: lookup("next_anatomy_title"),
        descriptionKey: lookup("next_anatomy_description"),
        url: "/spec/anatomy",
        onNavigate: () => this.navigate("/spec/anatomy"),
      },
      {
        id: "next_validation",
        titleKey: lookup("next_validation_title"),
        descriptionKey: lookup("next_validation_description"),
        url: "/spec/validation-and-drift",
        onNavigate: () => this.navigate("/spec/validation-and-drift"),
      },
    ];

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`spec_texts_files_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`spec_texts_files_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
