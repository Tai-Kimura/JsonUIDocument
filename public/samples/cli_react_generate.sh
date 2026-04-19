# Generate a new view with Next.js page
rjui generate view HomeView
rjui g view HomeView              # shorthand
rjui g v HomeView                 # short alias

# Generate view with ViewModel
rjui g view HomeView --with-viewmodel

# Generate nested view path
rjui g view learn/components/ButtonDetail

# Generate a reusable component
rjui g component CardView
rjui g c CardView                 # shorthand

# Generate component with ViewModel
rjui g component UserCard --with-viewmodel

# Generate a custom converter
rjui g converter CodeBlock --attributes file:String,language:String
rjui g conv StatusBadge --no-container
rjui g converter Card --container

# Generate types:
# - view, v       Generate a Next.js page (layout + optional ViewModel)
# - component, c  Generate a reusable component
# - converter     Generate a custom JSON to React converter
