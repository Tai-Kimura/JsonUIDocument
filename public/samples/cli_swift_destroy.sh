# Destroy a view and its related files
sjui destroy view HomeView
sjui d view HomeView              # shorthand

# Destroy with force (no confirmation prompt)
sjui d view HomeView --force
sjui d view HomeView -f

# Destroy types:
# - view       Remove ViewController/View, layout JSON, and binding
# - partial    Remove partial layout JSON and binding
# - collection Remove collection view, cell, and related bindings
# - binding    Remove binding file only

# This command removes:
# - The JSON layout file
# - The generated Swift files
# - The ViewModel (if present)
# - Updates Xcode project references (if xcodeproj gem is installed)
