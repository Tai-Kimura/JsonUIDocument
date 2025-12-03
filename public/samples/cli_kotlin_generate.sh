# Generate a new view with ViewModel and layout file
kjui generate view HomeView
kjui g view HomeView              # shorthand

# Generate for XML mode with Activity
kjui g view HomeView --mode xml --activity

# Generate for XML mode with Fragment
kjui g view ProfileView --mode xml --fragment

# Generate a partial view (reusable component)
kjui g partial HeaderView

# Generate a collection view
kjui g collection ProductList

# Generate a cell for LazyColumn (Compose only)
kjui g cell ProductItem

# Generate a binding file (XML mode only)
kjui g binding UserData

# Generate a custom converter (Compose only)
kjui g converter CustomCard --container
kjui g converter StatusBadge --attr text:String --attr color:Color

# Force overwrite existing files
kjui g view HomeView -f

# Global options:
# --mode, -m MODE     Override mode (xml/compose)
