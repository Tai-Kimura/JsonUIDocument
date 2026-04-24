// ViewModel for Learn > Hello World.
//
// This screen's VM is not auto-generated via `jui build`'s ViewModelBase
// pathway because the layout file (`learn/hello-world.json`) does not yet
// map onto a `jui g project`-scaffolded base for this repo. The public
// contract — currentLanguage / activeTab / breadcrumbItems / prerequisites
// / platformTabs / swift+kotlin+reactSteps / nextSteps / onToggleLanguage
// — mirrors the spec at docs/screens/json/learn/hello-world.spec.json so a
// future regeneration slotting this file under a generated base is purely
// mechanical.
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { HelloWorldData } from "@/generated/data/HelloWorldData";
import { CollectionDataSource } from "@/generated/data/CollectionDataSource";
import { StringManager } from "@/generated/StringManager";

/**
 * Local view of a QuickstartStep cell as hydrated by this ViewModel.
 * Mirrors QuickstartStepData's field list plus the four QuickstartStep
 * spec properties that do not appear on the generated cell Data type
 * (id / number / language identity).
 */
interface QuickstartStepCell {
  id: string;
  numberLabel: string;
  titleKey: string;
  instructionKey: string;
  code?: string;
  language: string;
  filename?: string;
  showLineNumbers: boolean;
  codeVisibility: string;
}

interface PrerequisiteCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  iconName: string;
}

interface TabHeaderCell {
  id: string;
  labelKey: string;
  bgColor: string;
  fgColor: string;
  borderColor: string;
  onSelect: () => void;
}

interface BreadcrumbCell {
  id: string;
  labelKey: string;
  onNavigate?: () => void;
}

interface NextStepCell {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  onNavigate: () => void;
}

export class HelloWorldViewModel {
  protected router: AppRouterInstance;
  protected _getData: () => HelloWorldData;
  protected _setData: (
    data: HelloWorldData | ((prev: HelloWorldData) => HelloWorldData),
  ) => void;
  // State not bound in the layout: activeTab drives the per-platform panel
  // visibility (derived fields swiftPanelVisibility/etc. ARE in the data
  // block); currentLanguage triggers re-seed on language toggle.
  private _activeTab: string = "swift";

  get data(): HelloWorldData {
    return this._getData();
  }

  constructor(
    router: AppRouterInstance,
    getData: () => HelloWorldData,
    setData: (
      data: HelloWorldData | ((prev: HelloWorldData) => HelloWorldData),
    ) => void,
  ) {
    this.router = router;
    this._getData = getData;
    this._setData = setData;
    this.initializeEventHandlers();
    // Auto-populate on first construction. The hook layer re-uses the
    // same ViewModel across renders, so this runs once per mount.
    this.onAppear();
  }

  updateData = (updates: Partial<HelloWorldData>) => {
    this._setData((prev) => ({ ...prev, ...updates }));
  };

  setVars = (vars: Partial<HelloWorldData>) => {
    this.updateData(vars);
  };

  protected initializeEventHandlers = () => {
    this.updateData({
    });
  };

  /**
   * Populate breadcrumbItems / prerequisites / platformTabs (with per-tab
   * QuickstartStep lists) / nextSteps with the static v1 catalog. All
   * user-visible strings come from StringManager so language toggle flows
   * through re-seeding on onToggleLanguage.
   */
  onAppear = () => {
    const breadcrumbItems: BreadcrumbCell[] = [
      {
        id: "bc_learn",
        labelKey: this.s("bc_learn"),
        onNavigate: () => this.navigate("/"),
      },
      {
        id: "bc_hello_world",
        labelKey: this.s("bc_hello_world"),
      },
    ];

    const prerequisites: PrerequisiteCell[] = [
      {
        id: "prereq_node",
        titleKey: this.s("prereq_node_title"),
        descriptionKey: this.s("prereq_node_description"),
        iconName: "Node 20+",
      },
      {
        id: "prereq_git",
        titleKey: this.s("prereq_git_title"),
        descriptionKey: this.s("prereq_git_description"),
        iconName: "git + curl",
      },
      {
        id: "prereq_shell",
        titleKey: this.s("prereq_shell_title"),
        descriptionKey: this.s("prereq_shell_description"),
        iconName: "POSIX",
      },
    ];

    const platformTabs: TabHeaderCell[] = this.buildPlatformTabs(this._activeTab);

    const installOneLiner =
      "curl -fsSL https://raw.githubusercontent.com/Tai-Kimura/JsonUI-Agents-for-claude/main/installer/bootstrap.sh | bash";
    // A richer Hello World layout: centered greeting + counter + Button.
    // Demonstrates View/Label/Button composition, two-way-style binding, and
    // the minimum `data` block every page declares for its ViewModel.
    const sampleHomeLayout = [
      '{',
      '  "type": "View",',
      '  "id": "home_root",',
      '  "orientation": "vertical",',
      '  "width": "matchParent",',
      '  "height": "matchParent",',
      '  "gravity": "center",',
      '  "paddings": [24, 24, 24, 24],',
      '  "child": [',
      '    {',
      '      "data": [',
      '        { "name": "message", "class": "String", "defaultValue": "Hello, JsonUI!" },',
      '        { "name": "tapCount", "class": "Int", "defaultValue": 0 },',
      '        { "name": "onTap", "class": "() -> Void" }',
      '      ]',
      '    },',
      '    {',
      '      "type": "Label",',
      '      "text": "@{message}",',
      '      "fontSize": 32,',
      '      "fontWeight": "bold",',
      '      "fontColor": "#0B1220"',
      '    },',
      '    {',
      '      "type": "Label",',
      '      "text": "Tapped @{tapCount} times",',
      '      "fontSize": 16,',
      '      "fontColor": "#475467",',
      '      "topMargin": 8',
      '    },',
      '    {',
      '      "type": "Button",',
      '      "text": "Tap me",',
      '      "onClick": "@{onTap}",',
      '      "topMargin": 16,',
      '      "paddings": [10, 20, 10, 20],',
      '      "background": "#2563EB",',
      '      "fontColor": "#FFFFFF",',
      '      "cornerRadius": 999',
      '    }',
      '  ]',
      '}',
    ].join("\n");
    const sampleSwiftViewModel = [
      "import Foundation",
      "",
      "// HomeData and HomeViewModelProtocol are generated by `jui build`.",
      "// HomeData holds message / tapCount / onTap from the layout's data block.",
      "class HomeViewModel: ObservableObject, HomeViewModelProtocol {",
      "    @Published var data = HomeData()",
      "",
      "    init() {",
      "        setupActionHandlers()",
      "    }",
      "",
      "    private func setupActionHandlers() {",
      "        data.onTap = { [weak self] in",
      "            self?.data.tapCount += 1",
      "        }",
      "    }",
      "}",
    ].join("\n");
    const sampleKotlinViewModel = [
      "// HomeData and HomeViewModelProtocol are generated by `jui build`.",
      "// HomeData holds message / tapCount / onTap from the layout's data block.",
      "@HiltViewModel",
      "class HomeViewModel @Inject constructor(",
      "    application: Application,",
      ") : AndroidViewModel(application), HomeViewModelProtocol {",
      "",
      "    private val _data = MutableStateFlow(HomeData())",
      "    override val data: StateFlow<HomeData> = _data.asStateFlow()",
      "",
      "    init {",
      "        setupActionHandlers()",
      "    }",
      "",
      "    private fun setupActionHandlers() {",
      "        _data.update { current ->",
      "            current.copy(onTap = {",
      "                _data.update { it.copy(tapCount = it.tapCount + 1) }",
      "            })",
      "        }",
      "    }",
      "}",
    ].join("\n");
    const sampleReactViewModel = [
      "import { AppRouterInstance } from \"next/dist/shared/lib/app-router-context.shared-runtime\";",
      "import { HomeData } from \"@/generated/data/HomeData\";",
      "",
      "// HomeData is generated by `jui build`; the VM is hand-written.",
      "// A companion hook wires up (router, getData, setData) on the page.",
      "export class HomeViewModel {",
      "  protected router: AppRouterInstance;",
      "  protected _getData: () => HomeData;",
      "  protected _setData: (",
      "    data: HomeData | ((prev: HomeData) => HomeData),",
      "  ) => void;",
      "",
      "  get data() { return this._getData(); }",
      "",
      "  constructor(",
      "    router: AppRouterInstance,",
      "    getData: () => HomeData,",
      "    setData: (d: HomeData | ((prev: HomeData) => HomeData)) => void,",
      "  ) {",
      "    this.router = router;",
      "    this._getData = getData;",
      "    this._setData = setData;",
      "    this.onAppear();",
      "  }",
      "",
      "  updateData = (updates: Partial<HomeData>) => {",
      "    this._setData((prev) => ({ ...prev, ...updates }));",
      "  };",
      "",
      "  onAppear = () => {",
      "    this.updateData({",
      "      message: \"Hello, JsonUI!\",",
      "      tapCount: 0,",
      "      onTap: this.handleTap,",
      "    });",
      "  };",
      "",
      "  handleTap = () => {",
      "    this.updateData({ tapCount: this.data.tapCount + 1 });",
      "  };",
      "}",
    ].join("\n");

    // Cross-platform steps (identical for Swift / Kotlin / React) rendered
    // above the tab switcher. Platform-specific commands (jui init flags,
    // ViewModel code, running the app) live in the per-tab steps below.
    const juiInitMultiFlag = [
      "# Run from your workspace root after creating the platform project(s).",
      "# Pass only the flag(s) for the platform(s) you're targeting.",
      "jui init \\",
      "  --project-name my-app \\",
      "  --ios ios --ios-mode swiftui \\",
      "  --android android --package-name com.example.myapp --android-mode compose \\",
      "  --web web",
    ].join("\n");
    const commonSteps: QuickstartStepCell[] = [
      this.stepWithCode("common-1", "1", "step_install_title", "step_install_instruction", installOneLiner, "bash", "shell", false),
      this.stepWithoutCode("common-2", "2", "step_create_platform_title", "step_create_platform_instruction"),
      this.stepWithCode("common-3", "3", "step_jui_init_title", "step_jui_init_instruction", juiInitMultiFlag, "bash", "shell", false),
      this.stepWithCode("common-4", "4", "step_author_title", "step_author_instruction", sampleHomeLayout, "json", "docs/screens/layouts/home.json", true),
      this.stepWithCode("common-5", "5", "step_build_verify_title", "step_build_verify_instruction", "jui build\njui verify --fail-on-diff", "bash", "shell", false),
    ];

    // Platform-specific remainder: wire the ViewModel and run the app.
    // `jui hotload listen` (iOS+Android only) is the mobile live-reload path;
    // the web tab relies on Next.js Fast Refresh instead.
    const swiftSteps: QuickstartStepCell[] = [
      this.stepWithCode("swift-6", "6", "step_viewmodel_swift_title", "step_viewmodel_swift_instruction", sampleSwiftViewModel, "swift", "ios/MyApp/ViewModel/HomeViewModel.swift", true),
      this.stepWithCode("swift-7", "7", "step_run_swift_title", "step_run_swift_instruction", "open ios/MyApp.xcodeproj\n# In Xcode: ⌘R to run the simulator.\n# In another terminal, start live-reload for the layout:\njui hotload listen", "bash", "shell", false),
      this.stepWithoutCode("swift-8", "8", "step_see_title", "step_see_instruction"),
    ];

    const kotlinSteps: QuickstartStepCell[] = [
      this.stepWithCode("kotlin-6", "6", "step_viewmodel_kotlin_title", "step_viewmodel_kotlin_instruction", sampleKotlinViewModel, "kotlin", "android/app/src/main/kotlin/com/example/myapp/viewmodel/HomeViewModel.kt", true),
      this.stepWithCode("kotlin-7", "7", "step_run_kotlin_title", "step_run_kotlin_instruction", "cd android && ./gradlew installDebug\n# Or open Android Studio and press Run.\n# In another terminal, start live-reload for the layout:\njui hotload listen", "bash", "shell", false),
      this.stepWithoutCode("kotlin-8", "8", "step_see_title", "step_see_instruction"),
    ];

    const reactSteps: QuickstartStepCell[] = [
      this.stepWithCode("react-6", "6", "step_viewmodel_react_title", "step_viewmodel_react_instruction", sampleReactViewModel, "typescript", "web/src/viewmodels/HomeViewModel.ts", true),
      this.stepWithCode("react-7", "7", "step_run_react_title", "step_run_react_instruction", "cd web && npm run dev\n# Open http://localhost:3000 — Next.js Fast Refresh handles live-reload automatically.", "bash", "shell", false),
      this.stepWithoutCode("react-8", "8", "step_see_title", "step_see_instruction"),
    ];

    const nextSteps: NextStepCell[] = [
      {
        id: "next-data-binding",
        titleKey: this.s("next_data_binding_title"),
        descriptionKey: this.s("next_data_binding_description"),
        url: "/learn/data-binding-basics",
        onNavigate: () => this.navigate("/learn/data-binding-basics"),
      },
      {
        id: "next-first-screen",
        titleKey: this.s("next_first_screen_title"),
        descriptionKey: this.s("next_first_screen_description"),
        url: "/learn/first-screen",
        onNavigate: () => this.navigate("/learn/first-screen"),
      },
      {
        id: "next-reference",
        titleKey: this.s("next_reference_title"),
        descriptionKey: this.s("next_reference_description"),
        url: "/reference/attributes",
        onNavigate: () => this.navigate("/reference/attributes"),
      },
    ];
    this.updateData({
      breadcrumbItems: this.asCollection(breadcrumbItems),
      prerequisites: this.asCollection(prerequisites),
      commonSteps: this.asCollection(commonSteps),
      platformTabs: this.asCollection(platformTabs),
      swiftSteps: this.asCollection(swiftSteps),
      kotlinSteps: this.asCollection(kotlinSteps),
      reactSteps: this.asCollection(reactSteps),
      nextSteps: this.asCollection(nextSteps),
      ...this.panelVisibilityFor(this._activeTab),
    });
  };

  /**
   * Switch the inline platform switcher. T6 pattern: updates activeTab
   * plus the three platform_panel_* visibility strings derived from it.
   */
  onSelectTab = (id: string): void => {
    this._activeTab = id;
    this.updateData({
      platformTabs: this.asCollection(this.buildPlatformTabs(id)),
      ...this.panelVisibilityFor(id),
    });
  };

  private buildPlatformTabs = (activeId: string): TabHeaderCell[] => {
    const make = (id: string, labelKey: string): TabHeaderCell => {
      const isActive = id === activeId;
      return {
        id,
        labelKey,
        bgColor: isActive ? "var(--color-accent)" : "var(--color-surface)",
        fgColor: isActive ? "var(--color-accent_ink)" : "var(--color-ink)",
        borderColor: isActive ? "var(--color-accent)" : "var(--color-border)",
        onSelect: () => this.onSelectTab(id),
      };
    };
    return [
      make("swift", this.s("tab_swift")),
      make("kotlin", this.s("tab_kotlin")),
      make("react", this.s("tab_react")),
    ];
  };

  /**
   * Client-side navigation — funnels every link-tap through a single
   * method so analytics / middleware can hook in later.
   */
  onNavigate = (url: string): void => {
    this.navigate(url);
  };

  navigate = (url: string): void => {
    this.router.push(url);
  };

  /**
   * Toggle the StringManager between the two configured languages and
   * re-seed the static catalog so cell keys resolve in the new language.
   */

  // -- helpers --

  /**
   * Resolve a bare string key (e.g. "title") against the current language's
   * snake_case flat map, scoped to this screen's prefix.
   */
  private s = (key: string): string => {
    return StringManager.getString(`learn_hello_world_${key}`);
  };

  private panelVisibilityFor = (
    id: string,
  ): Pick<
    HelloWorldData,
    "swiftPanelVisibility" | "kotlinPanelVisibility" | "reactPanelVisibility"
  > => ({
    swiftPanelVisibility: id === "swift" ? "visible" : "gone",
    kotlinPanelVisibility: id === "kotlin" ? "visible" : "gone",
    reactPanelVisibility: id === "react" ? "visible" : "gone",
  });

  private stepWithCode = (
    id: string,
    numberLabel: string,
    titleKey: string,
    instructionKey: string,
    code: string,
    language: string,
    filename: string,
    showLineNumbers: boolean,
  ): QuickstartStepCell => ({
    id,
    numberLabel,
    titleKey: this.s(titleKey),
    instructionKey: this.s(instructionKey),
    code,
    language,
    filename,
    showLineNumbers,
    codeVisibility: "visible",
  });

  private stepWithoutCode = (
    id: string,
    numberLabel: string,
    titleKey: string,
    instructionKey: string,
  ): QuickstartStepCell => ({
    id,
    numberLabel,
    titleKey: this.s(titleKey),
    instructionKey: this.s(instructionKey),
    language: "bash",
    showLineNumbers: false,
    codeVisibility: "gone",
  });

  private asCollection = <T>(
    items: T[],
  ): CollectionDataSource<T> => {
    return new CollectionDataSource<T>([{ cells: { data: items } }]);
  };
}
