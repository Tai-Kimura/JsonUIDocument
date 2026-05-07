// ViewModel for Reference > JSON Schema.

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { JsonSchemaData } from "@/generated/data/JsonSchemaData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

interface NextReadCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class JsonSchemaViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => JsonSchemaData;
  protected _setData: (
    data: JsonSchemaData | ((prev: JsonSchemaData) => JsonSchemaData),
  ) => void;

  get data(): JsonSchemaData { return this._getData(); }

  constructor(
    router: AppRouterInstance,
    getData: () => JsonSchemaData,
    setData: (data: JsonSchemaData | ((prev: JsonSchemaData) => JsonSchemaData)) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    this.onAppear();
  }

  updateData = (updates: Partial<JsonSchemaData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<JsonSchemaData>) => { this.updateData(vars); };

  protected initializeEventHandlers = () => {
    this.updateData({
      onNavigateReference: () => this.navigate("/"),
    });
  };

  onAppear = () => {

    const nextReads: NextReadCell[] = [
      {
        id: "next_attributes",
        titleKey: this.s("next_attributes_title"),
        descriptionKey: this.s("next_attributes_description"),
        url: "/reference/attributes",
        onNavigate: () => this.navigate("/reference/attributes"),
      },
      {
        id: "next_spec_first",
        titleKey: this.s("next_spec_first_title"),
        descriptionKey: this.s("next_spec_first_description"),
        url: "/concepts/why-spec-first",
        onNavigate: () => this.navigate("/concepts/why-spec-first"),
      },
    ];

    this.updateData({ nextReadLinks: this.asCollection(nextReads) });
  };

  navigate = (url: string): void => { this.router.push(url); };

  private s = (key: string): string =>
    StringManager.getString(`reference_json_schema_${key}`);

  private asCollection = <T>(items: T[]): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
