# Build Kotlin files from JSON layouts
kjui build

# Build for specific mode
kjui build --mode compose
kjui build --mode xml

# Build with clean cache
kjui build --clean

# This generates (Compose mode):
# - Kotlin Compose composables
# - Data models from JSON
# - ViewModel bindings
# - ResourceManager for strings and colors

# This generates (XML mode):
# - XML layout files
# - Binding classes
# - Activity/Fragment files
