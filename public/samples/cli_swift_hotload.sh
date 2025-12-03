# Start HotLoader server for real-time updates
sjui hotload listen
sjui server              # alias

# Start on specific port
sjui hotload listen --port 8080

# Stop HotLoader server
sjui hotload stop

# Check HotLoader status
sjui hotload status

# HotLoader enables:
# - Real-time UI updates without app rebuild
# - Instant preview of JSON layout changes
# - WebSocket-based communication with iOS device/simulator
# - Supports both UIKit and SwiftUI modes
