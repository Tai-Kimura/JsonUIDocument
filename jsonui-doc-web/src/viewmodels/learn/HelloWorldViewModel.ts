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
  private _activeTab: string = "react";

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

    const platformTabs: TabHeaderCell[] = [
      {
        id: "swift",
        labelKey: this.s("tab_swift"),
        onSelect: () => this.onSelectTab("swift"),
      },
      {
        id: "kotlin",
        labelKey: this.s("tab_kotlin"),
        onSelect: () => this.onSelectTab("kotlin"),
      },
      {
        id: "react",
        labelKey: this.s("tab_react"),
        onSelect: () => this.onSelectTab("react"),
      },
    ];

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
      "@MainActor",
      "final class HomeViewModel: ObservableObject {",
      "    @Published var message: String = \"Hello, JsonUI!\"",
      "    @Published var tapCount: Int = 0",
      "",
      "    func onTap() {",
      "        tapCount += 1",
      "    }",
      "}",
    ].join("\n");
    const sampleKotlinViewModel = [
      "class HomeViewModel : ViewModel() {",
      "    private val _message = MutableStateFlow(\"Hello, JsonUI!\")",
      "    val message: StateFlow<String> = _message.asStateFlow()",
      "",
      "    private val _tapCount = MutableStateFlow(0)",
      "    val tapCount: StateFlow<Int> = _tapCount.asStateFlow()",
      "",
      "    fun onTap() {",
      "        _tapCount.update { it + 1 }",
      "    }",
      "}",
    ].join("\n");
    const sampleReactViewModel = [
      "export class HomeViewModel extends ViewModel {",
      "  message = \"Hello, JsonUI!\";",
      "  tapCount = 0;",
      "",
      "  onTap() {",
      "    this.tapCount += 1;",
      "    this.notify();",
      "  }",
      "}",
    ].join("\n");

    const swiftSteps: QuickstartStepCell[] = [
      this.stepWithCode("swift-1", "1", "step_install_title", "step_install_instruction", installOneLiner, "bash", "shell", false),
      this.stepWithCode("swift-2", "2", "step_init_swift_title", "step_init_swift_instruction", "sjui init my-app --swiftui\ncd my-app", "bash", "shell", false),
      this.stepWithCode("swift-3", "3", "step_author_title", "step_author_instruction", sampleHomeLayout, "json", "docs/screens/layouts/home.json", true),
      this.stepWithCode("swift-4", "4", "step_viewmodel_swift_title", "step_viewmodel_swift_instruction", sampleSwiftViewModel, "swift", "HomeViewModel.swift", true),
      this.stepWithCode("swift-5", "5", "step_build_swift_title", "step_build_swift_instruction", "sjui build\nopen MyApp.xcodeproj\n# In Xcode: ⌘R to run the simulator", "bash", "shell", false),
      this.stepWithoutCode("swift-6", "6", "step_see_title", "step_see_instruction"),
    ];

    const kotlinSteps: QuickstartStepCell[] = [
      this.stepWithCode("kotlin-1", "1", "step_install_title", "step_install_instruction", installOneLiner, "bash", "shell", false),
      this.stepWithCode("kotlin-2", "2", "step_init_kotlin_title", "step_init_kotlin_instruction", "kjui init my-app --compose\ncd my-app", "bash", "shell", false),
      this.stepWithCode("kotlin-3", "3", "step_author_title", "step_author_instruction", sampleHomeLayout, "json", "docs/screens/layouts/home.json", true),
      this.stepWithCode("kotlin-4", "4", "step_viewmodel_kotlin_title", "step_viewmodel_kotlin_instruction", sampleKotlinViewModel, "kotlin", "HomeViewModel.kt", true),
      this.stepWithCode("kotlin-5", "5", "step_build_kotlin_title", "step_build_kotlin_instruction", "kjui build\n./gradlew installDebug\n# Open Android Studio and press Run", "bash", "shell", false),
      this.stepWithoutCode("kotlin-6", "6", "step_see_title", "step_see_instruction"),
    ];

    const reactSteps: QuickstartStepCell[] = [
      this.stepWithCode("react-1", "1", "step_install_title", "step_install_instruction", installOneLiner, "bash", "shell", false),
      this.stepWithCode("react-2", "2", "step_init_react_title", "step_init_react_instruction", "rjui init my-app\ncd my-app\nnpm install", "bash", "shell", false),
      this.stepWithCode("react-3", "3", "step_author_title", "step_author_instruction", sampleHomeLayout, "json", "docs/screens/layouts/home.json", true),
      this.stepWithCode("react-4", "4", "step_viewmodel_react_title", "step_viewmodel_react_instruction", sampleReactViewModel, "typescript", "src/viewmodels/HomeViewModel.ts", true),
      this.stepWithCode("react-5", "5", "step_build_react_title", "step_build_react_instruction", "rjui build\nnpm run dev\n# Open http://localhost:3000", "bash", "shell", false),
      this.stepWithoutCode("react-6", "6", "step_see_title", "step_see_instruction"),
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
      ...this.panelVisibilityFor(id),
    });
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
