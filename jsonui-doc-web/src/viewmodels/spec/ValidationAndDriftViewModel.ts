// ViewModel for Spec > Validation + drift detection (Phase 3 closer).

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ValidationAndDriftData } from "@/generated/data/ValidationAndDriftData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class ValidationAndDriftViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => ValidationAndDriftData;
  protected _setData: (
    data: ValidationAndDriftData | ((prev: ValidationAndDriftData) => ValidationAndDriftData),
  ) => void;

  get data(): ValidationAndDriftData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => ValidationAndDriftData,
    setData: (data: ValidationAndDriftData | ((prev: ValidationAndDriftData) => ValidationAndDriftData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<ValidationAndDriftData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<ValidationAndDriftData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateLayoutFile: () => this.navigate("/spec/layout-file"),
      onNavigateSpec: () => this.navigate("/spec/split-overview"),
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
        id: "next_split_overview",
        titleKey: lookup("next_split_overview_title"),
        descriptionKey: lookup("next_split_overview_description"),
        url: "/spec/split-overview",
        onNavigate: () => this.navigate("/spec/split-overview"),
      },
      {
        id: "next_test_runner",
        titleKey: lookup("next_test_runner_title"),
        descriptionKey: lookup("next_test_runner_description"),
        url: "/tools/test-runner",
        onNavigate: () => this.navigate("/tools/test-runner"),
      },
    ];

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`spec_validation_and_drift_${key}`);

  private sDefault = (key: string): string =>
    StringManager.getDefaultString(`spec_validation_and_drift_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
