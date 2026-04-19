# Build Swift files from JSON layouts
sjui build

# Build for specific mode
sjui build --mode swiftui
sjui build --mode uikit

# Build with clean cache
sjui build --clean

# Build with quiet output (errors only)
sjui build --quiet
sjui build -q

# Build with verbose output (debug information)
sjui build --verbose
sjui build -v

# This generates:
# - UIKit: ViewController + Binding files
# - SwiftUI: View structs with Observable ViewModel
