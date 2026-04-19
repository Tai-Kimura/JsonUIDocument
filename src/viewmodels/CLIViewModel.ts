import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { StringManager } from "@/generated/StringManager";

interface CLITableRowData {
  name: string;
  description: string;
}

// Helper to get localized string
const t = (key: string): string => {
  return (StringManager.currentLanguage as Record<string, string>)[key] || key;
};

export class CLIViewModel {
  private router: AppRouterInstance;
  private _currentTab: number;
  private _setCurrentTab: (tab: number) => void;

  constructor(
    router: AppRouterInstance,
    currentTab: number,
    setCurrentTab: (tab: number) => void
  ) {
    this.router = router;
    this._currentTab = currentTab;
    this._setCurrentTab = setCurrentTab;
  }

  get data() {
    return {
      currentTab: this._currentTab,
      setCurrentTab: this._setCurrentTab,
      onTabChange: this.onTabChange,
      onClickLearn: this.onClickLearn,
      onClickReference: this.onClickReference,
      // Tab visibility
      showSwiftContent: this._currentTab === 0,
      showKotlinContent: this._currentTab === 1,
      showReactContent: this._currentTab === 2,
      // Swift CLI data
      swiftInitOptions: this.swiftInitOptions,
      swiftGenArgs: this.swiftGenArgs,
      swiftGenOptions: this.swiftGenOptions,
      swiftBuildOptions: this.swiftBuildOptions,
      swiftWatchOptions: this.swiftWatchOptions,
      swiftHotloadSubcommands: this.swiftHotloadSubcommands,
      swiftHotloadOptions: this.swiftHotloadOptions,
      swiftConvertArgs: this.swiftConvertArgs,
      swiftConvertOptions: this.swiftConvertOptions,
      swiftDestroyArgs: this.swiftDestroyArgs,
      swiftDestroyOptions: this.swiftDestroyOptions,
      swiftValidateOptions: this.swiftValidateOptions,
      // Kotlin CLI data
      kotlinInitOptions: this.kotlinInitOptions,
      kotlinGenArgs: this.kotlinGenArgs,
      kotlinGenOptions: this.kotlinGenOptions,
      kotlinBuildOptions: this.kotlinBuildOptions,
      kotlinHotloadSubcommands: this.kotlinHotloadSubcommands,
      // React CLI data
      reactGenArgs: this.reactGenArgs,
      reactGenOptions: this.reactGenOptions,
      reactHotloadSubcommands: this.reactHotloadSubcommands,
    };
  }

  onTabChange = (index: number) => {
    this._setCurrentTab(index);
  };

  onClickLearn = () => {
    this.router.push("/learn");
  };

  onClickReference = () => {
    this.router.push("/reference");
  };

  // Swift CLI data
  get swiftInitOptions(): CLITableRowData[] {
    return [
      { name: "--mode MODE", description: t("cli_swift_init_mode_desc") }
    ];
  }

  get swiftGenArgs(): CLITableRowData[] {
    return [
      { name: "TYPE", description: t("cli_swift_gen_type_desc") },
      { name: "NAME", description: t("cli_swift_gen_name_desc") }
    ];
  }

  get swiftGenOptions(): CLITableRowData[] {
    return [
      { name: "--mode MODE", description: t("cli_swift_gen_mode_desc") },
      { name: "--root", description: t("cli_swift_gen_root_desc") },
      { name: "--attributes ATTRS", description: t("cli_swift_gen_attributes_desc") },
      { name: "-f, --force", description: t("cli_swift_gen_force_desc") }
    ];
  }

  get swiftBuildOptions(): CLITableRowData[] {
    return [
      { name: "--mode MODE", description: t("cli_swift_build_mode_desc") },
      { name: "--clean", description: t("cli_swift_build_clean_desc") },
      { name: "-q, --quiet", description: t("cli_swift_build_quiet_desc") },
      { name: "-v, --verbose", description: t("cli_swift_build_verbose_desc") }
    ];
  }

  get swiftWatchOptions(): CLITableRowData[] {
    return [
      { name: "--mode MODE", description: t("cli_swift_watch_mode_desc") }
    ];
  }

  get swiftHotloadSubcommands(): CLITableRowData[] {
    return [
      { name: "listen", description: t("cli_swift_hotload_listen_desc") },
      { name: "stop", description: t("cli_swift_hotload_stop_desc") },
      { name: "status", description: t("cli_swift_hotload_status_desc") }
    ];
  }

  get swiftHotloadOptions(): CLITableRowData[] {
    return [
      { name: "--port PORT", description: t("cli_swift_hotload_port_desc") }
    ];
  }

  get swiftConvertArgs(): CLITableRowData[] {
    return [
      { name: "INPUT", description: t("cli_swift_convert_input_desc") },
      { name: "OUTPUT", description: t("cli_swift_convert_output_desc") }
    ];
  }

  get swiftConvertOptions(): CLITableRowData[] {
    return [
      { name: "--from TYPE", description: t("cli_swift_convert_from_desc") },
      { name: "--to TYPE", description: t("cli_swift_convert_to_desc") }
    ];
  }

  get swiftDestroyArgs(): CLITableRowData[] {
    return [
      { name: "TYPE", description: t("cli_swift_destroy_type_desc") },
      { name: "NAME", description: t("cli_swift_destroy_name_desc") }
    ];
  }

  get swiftDestroyOptions(): CLITableRowData[] {
    return [
      { name: "-f, --force", description: t("cli_swift_destroy_force_desc") }
    ];
  }

  get swiftValidateOptions(): CLITableRowData[] {
    return [
      { name: "-v, --verbose", description: t("cli_swift_validate_verbose_desc") }
    ];
  }

  // Kotlin CLI data
  get kotlinInitOptions(): CLITableRowData[] {
    return [
      { name: "--mode MODE", description: t("cli_kotlin_init_mode_desc") }
    ];
  }

  get kotlinGenArgs(): CLITableRowData[] {
    return [
      { name: "TYPE", description: t("cli_kotlin_gen_type_desc") },
      { name: "NAME", description: t("cli_kotlin_gen_name_desc") }
    ];
  }

  get kotlinGenOptions(): CLITableRowData[] {
    return [
      { name: "--mode MODE", description: t("cli_kotlin_gen_mode_desc") },
      { name: "--activity", description: t("cli_kotlin_gen_activity_desc") },
      { name: "--fragment", description: t("cli_kotlin_gen_fragment_desc") },
      { name: "-f, --force", description: t("cli_kotlin_gen_force_desc") }
    ];
  }

  get kotlinBuildOptions(): CLITableRowData[] {
    return [
      { name: "--mode MODE", description: t("cli_kotlin_build_mode_desc") },
      { name: "--clean", description: t("cli_kotlin_build_clean_desc") }
    ];
  }

  get kotlinHotloadSubcommands(): CLITableRowData[] {
    return [
      { name: "start, listen", description: t("cli_kotlin_hotload_start_desc") },
      { name: "stop", description: t("cli_kotlin_hotload_stop_desc") },
      { name: "status", description: t("cli_kotlin_hotload_status_desc") }
    ];
  }

  // React CLI data
  get reactGenArgs(): CLITableRowData[] {
    return [
      { name: "TYPE", description: t("cli_react_gen_type_desc") },
      { name: "NAME", description: t("cli_react_gen_name_desc") }
    ];
  }

  get reactGenOptions(): CLITableRowData[] {
    return [
      { name: "--with-viewmodel", description: t("cli_react_gen_viewmodel_desc") },
      { name: "--container", description: t("cli_react_gen_container_desc") },
      { name: "--no-container", description: t("cli_react_gen_nocontainer_desc") },
      { name: "--attributes ATTRS", description: t("cli_react_gen_attributes_desc") }
    ];
  }

  get reactHotloadSubcommands(): CLITableRowData[] {
    return [
      { name: "listen", description: t("cli_react_hotload_listen_desc") },
      { name: "stop", description: t("cli_react_hotload_stop_desc") },
      { name: "status", description: t("cli_react_hotload_status_desc") }
    ];
  }
}
