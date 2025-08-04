#!/bin/bash

echo "Installing Vigilant Payroll Nexus..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed. Please install npm."
    exit 1
fi

echo "Node.js and npm are installed."
echo

# Install dependencies
echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies."
    exit 1
fi

echo
echo "Dependencies installed successfully!"
echo

# Create run script
echo "Creating run script..."
cat > run.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Vigilant Payroll Nexus..."
npm run dev
EOF

chmod +x run.sh

# Try to create desktop shortcut (Linux)
if [ "$XDG_CURRENT_DESKTOP" ]; then
    DESKTOP_DIR="$HOME/Desktop"
    if [ -d "$DESKTOP_DIR" ]; then
        cat > "$DESKTOP_DIR/Vigilant Payroll Nexus.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Vigilant Payroll Nexus
Comment=Payroll Management System
Exec=$PWD/run.sh
Icon=applications-development
Terminal=true
Categories=Office;
EOF
        chmod +x "$DESKTOP_DIR/Vigilant Payroll Nexus.desktop"
        echo "Desktop shortcut created (Linux)"
    fi
fi

# Try to create desktop shortcut (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    DESKTOP_DIR="$HOME/Desktop"
    if [ -d "$DESKTOP_DIR" ]; then
        cat > "$DESKTOP_DIR/Vigilant Payroll Nexus.command" << EOF
#!/bin/bash
cd "$PWD"
./run.sh
EOF
        chmod +x "$DESKTOP_DIR/Vigilant Payroll Nexus.command"
        echo "Desktop shortcut created (macOS)"
    fi
fi

echo
echo "Installation completed successfully!"
echo
echo "To start the application:"
echo "1. Double-click the desktop shortcut (if created), OR"
echo "2. Run './run.sh' in this directory, OR"
echo "3. Run 'npm run dev' in this directory"
echo
echo "The application will be available at http://localhost:8080"
echo