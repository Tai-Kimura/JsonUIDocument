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
      onNavigateSpec: () => this.navigate("/spec/split-overview"),
    });
  };

  onAppear = () => {
    const nextReads: NextReadCell[] = [
      {
        id: "next_split_overview",
        titleKey: this.s("next_split_overview_title"),
        descriptionKey: this.s("next_split_overview_description"),
        url: "/spec/split-overview",
        onNavigate: () => this.navigate("/spec/split-overview"),
      },
      {
        id: "next_test_runner",
        titleKey: this.s("next_test_runner_title"),
        descriptionKey: this.s("next_test_runner_description"),
        url: "/tools/test-runner",
        onNavigate: () => this.navigate("/tools/test-runner"),
      },
    ];

    this.updateData({
      nextReadLinks: this.asCollection(nextReads),
    });
  };

  navigate = (url: string): void => {
    this.router.push(url);
  };

  private s = (key: string): string =>
    StringManager.getString(`spec_validation_and_drift_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
