# Generate a new view with ViewModel and layout file
sjui generate view HomeView
sjui g view HomeView              # shorthand

# Generate a partial view (reusable component)
sjui g partial HeaderView

# Generate a collection view with cell
sjui g collection ProductList

# Generate a binding file only
sjui g binding UserData

# Generate a custom converter
sjui g converter CustomCard

# Generate types:
# - view       Generate a complete view (ViewController/SwiftUI View + layout)
# - partial    Generate a reusable partial component
# - collection Generate a collection/list view with cell
# - binding    Generate data binding files
# - converter  Generate a custom component converter
