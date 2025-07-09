#!/bin/bash

# Initialize Angular Application Script
# This script copies initialization files from init-built-ng to a target Angular application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if target application path is provided
if [ $# -eq 0 ]; then
    print_error "Usage: $0 <target-app-path>"
    print_info "Example: $0 apps/my-app"
    print_info "Example: $0 ./my-angular-app"
    exit 1
fi

TARGET_APP="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INIT_SOURCE="${SCRIPT_DIR}/init-built-ng"

# Validate source directory exists
if [ ! -d "$INIT_SOURCE" ]; then
    print_error "Source directory '$INIT_SOURCE' not found"
    exit 1
fi

# Validate target directory exists
if [ ! -d "$TARGET_APP" ]; then
    print_error "Target application directory '$TARGET_APP' not found"
    exit 1
fi

# Validate it's an Angular application
if [ ! -f "$TARGET_APP/src/main.ts" ] || [ ! -f "$TARGET_APP/src/app/app.config.ts" ]; then
    print_error "Target directory doesn't appear to be an Angular application"
    print_info "Expected to find: $TARGET_APP/src/main.ts and $TARGET_APP/src/app/app.config.ts"
    exit 1
fi

print_info "Initializing Angular application: $TARGET_APP"
print_info "Source directory: $INIT_SOURCE"

# 1. Copy assets to public folder
print_info "Copying assets to public folder..."
if [ -d "$INIT_SOURCE/assets" ]; then
    mkdir -p "$TARGET_APP/public/assets"
    cp -r "$INIT_SOURCE/assets"/* "$TARGET_APP/public/assets/"
    print_success "Assets copied to $TARGET_APP/public/assets/"
else
    print_warning "No assets folder found in $INIT_SOURCE"
fi

# 2. Copy configuration files to application root
print_info "Copying configuration files..."

config_files=(".postcssrc.json" ".prettierignore" ".prettierrc" "eslint.config.cjs")
for file in "${config_files[@]}"; do
    if [ -f "$INIT_SOURCE/$file" ]; then
        cp "$INIT_SOURCE/$file" "$TARGET_APP/"
        print_success "Copied $file to $TARGET_APP/"
    else
        print_warning "File $file not found in $INIT_SOURCE"
    fi
done

# 3. Replace styles.scss
print_info "Replacing styles.scss..."
if [ -f "$INIT_SOURCE/styles.scss" ]; then
    if [ -f "$TARGET_APP/src/styles.scss" ]; then
        cp "$TARGET_APP/src/styles.scss" "$TARGET_APP/src/styles.scss.backup"
        print_info "Backup created: $TARGET_APP/src/styles.scss.backup"
    fi
    cp "$INIT_SOURCE/styles.scss" "$TARGET_APP/src/styles.scss"
    print_success "Replaced styles.scss"
else
    print_warning "styles.scss not found in $INIT_SOURCE"
fi

# 4. Copy interceptors
print_info "Copying interceptors..."
if [ -d "$INIT_SOURCE/interceptors" ]; then
    mkdir -p "$TARGET_APP/src/interceptors"
    cp -r "$INIT_SOURCE/interceptors"/* "$TARGET_APP/src/interceptors/"
    print_success "Interceptors copied to $TARGET_APP/src/interceptors/"
else
    print_warning "No interceptors folder found in $INIT_SOURCE"
fi

# 5. Update app.config.ts
print_info "Updating app.config.ts..."

APP_CONFIG_PATH="$TARGET_APP/src/app/app.config.ts"
if [ -f "$APP_CONFIG_PATH" ]; then
    # Create backup
    cp "$APP_CONFIG_PATH" "$APP_CONFIG_PATH.backup"
    print_info "Backup created: $APP_CONFIG_PATH.backup"
    
    # Check if routes.ts exists, otherwise use app.routes
    ROUTES_IMPORT="./app.routes"
    if [ -f "$TARGET_APP/src/app/routes.ts" ]; then
        ROUTES_IMPORT="./routes"
    elif [ -f "$TARGET_APP/src/app/app.routes.ts" ]; then
        ROUTES_IMPORT="./app.routes"
    fi
    
    # Write new app.config.ts content
    cat > "$APP_CONFIG_PATH" << EOF
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { loggingInterceptor } from '../interceptors';
import { routes } from '${ROUTES_IMPORT}';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([loggingInterceptor])),
  ]
};
EOF
    print_success "Updated app.config.ts"
else
    print_error "app.config.ts not found at $APP_CONFIG_PATH"
fi

# 6. Handle routes file naming
ROUTES_PATH="$TARGET_APP/src/app/app.routes.ts"
NEW_ROUTES_PATH="$TARGET_APP/src/app/routes.ts"

if [ -f "$ROUTES_PATH" ] && [ ! -f "$NEW_ROUTES_PATH" ]; then
    print_info "Renaming app.routes.ts to routes.ts for consistency..."
    mv "$ROUTES_PATH" "$NEW_ROUTES_PATH"
    print_success "Renamed app.routes.ts to routes.ts"
elif [ -f "$ROUTES_PATH" ] && [ -f "$NEW_ROUTES_PATH" ]; then
    print_warning "Both app.routes.ts and routes.ts exist. Keeping existing structure."
elif [ ! -f "$ROUTES_PATH" ] && [ ! -f "$NEW_ROUTES_PATH" ]; then
    print_info "Creating basic routes.ts file..."
    cat > "$NEW_ROUTES_PATH" << 'EOF'
import { Routes } from '@angular/router';

export const routes: Routes = [
  // Add your routes here
];
EOF
    print_success "Created basic routes.ts file"
fi

print_success "Angular application initialization completed!"
print_info "Next steps:"
print_info "1. Install required dependencies if not already installed:"
print_info "   npm install @angular/common @angular/core @angular/platform-browser"
print_info "2. Review the updated app.config.ts and adjust imports as needed"
print_info "3. Test the application: npm start or ng serve"
print_warning "Note: Backup files were created for modified files (.backup extension)"
