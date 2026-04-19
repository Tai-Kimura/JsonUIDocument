# Convert JSON to SwiftUI code (one-time migration)
sjui convert HomeView

# Convert and generate grouped file structure
sjui convert HomeView --to-group

# This command is useful for:
# - One-time conversion of JSON layouts to native SwiftUI
# - Migration from JSON-based UI to pure Swift code
# - Generating reference SwiftUI implementations
#
# The output is native SwiftUI code that doesn't depend on SwiftJsonUI
