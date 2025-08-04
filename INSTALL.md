# Installation Guide

## Quick Installation

### Windows
1. Download or clone this repository
2. Double-click `install.bat`
3. Follow the on-screen instructions
4. Use the desktop shortcut to start the app

### Linux/macOS
1. Download or clone this repository
2. Open terminal in the project directory
3. Run: `chmod +x install.sh && ./install.sh`
4. Use the desktop shortcut or run `./run.sh` to start the app

## Manual Installation

### Prerequisites
- Node.js (version 18 or higher)
- npm (comes with Node.js)

### Steps
1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd <project-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:8080`

## Troubleshooting

### Node.js Not Found
If you get an error about Node.js not being found:
1. Download and install Node.js from [https://nodejs.org/](https://nodejs.org/)
2. Restart your terminal/command prompt
3. Run the installation script again

### Permission Denied (Linux/macOS)
If you get permission denied errors:
```bash
chmod +x install.sh
./install.sh
```

### Port Already in Use
If port 8080 is already in use, the application will automatically try the next available port.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Support

For issues and support, please check the project repository or contact the development team.