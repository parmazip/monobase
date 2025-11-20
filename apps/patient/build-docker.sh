#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
REGISTRY="ghcr.io/monobaselabs"
IMAGE_NAME="patientapp"
BUILD_COMMAND="bun run build"
PUSH=false
DRY_RUN=false
BUILD_ASSETS=true  # Default to building assets

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --push)
      PUSH=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-build-assets)
      BUILD_ASSETS=false
      shift
      ;;
    --build-command)
      BUILD_COMMAND="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Build and optionally push Docker image for patient app"
      echo ""
      echo "Options:"
      echo "  --skip-build-assets     Skip building assets (assumes dist exists)"
      echo "                          By default, assets ARE built"
      echo "  --build-command <cmd>   Custom build command (default: 'bun run build')"
      echo "  --push                  Push image to registry after building"
      echo "  --dry-run               Show what would be done without executing"
      echo "  --help, -h              Show this help message"
      echo ""
      echo "Example:"
      echo "  $0 --push                             # Build assets, then build and push image"
      echo "  $0 --build-command 'bun run build'    # Use custom build command"
      echo "  $0 --skip-build-assets --push         # Build and push image (assumes dist exists)"
      echo "  $0 --dry-run --push                   # Show what would happen"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
if [ -z "$VERSION" ]; then
  echo -e "${RED}Error: Could not read version from package.json${NC}"
  exit 1
fi

# Get git SHA for labels
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Full image names with tags
IMAGE_VERSION="${REGISTRY}/${IMAGE_NAME}:${VERSION}"
IMAGE_LATEST="${REGISTRY}/${IMAGE_NAME}:latest"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Docker Build Script - Patient App    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Version:${NC}       ${VERSION}"
echo -e "${GREEN}Git SHA:${NC}       ${GIT_SHA}"
echo -e "${GREEN}Registry:${NC}      ${REGISTRY}"
echo -e "${GREEN}Image:${NC}         ${IMAGE_NAME}"
echo -e "${GREEN}Tags:${NC}          ${VERSION}, latest"
echo -e "${GREEN}Build Command:${NC} ${BUILD_COMMAND}"
echo ""

# Build assets if not skipped
if [ "$BUILD_ASSETS" = true ]; then
  echo -e "${YELLOW}→ Building assets...${NC}"
  if [ "$DRY_RUN" = true ]; then
    echo -e "${BLUE}  [DRY RUN] Would run: ${BUILD_COMMAND}${NC}"
  else
    if ! eval "${BUILD_COMMAND}"; then
      echo -e "${RED}✗ Asset build failed${NC}"
      exit 1
    fi
    echo -e "${GREEN}✓ Assets built successfully${NC}"
  fi
  echo ""
else
  echo -e "${YELLOW}→ Skipping asset build (--skip-build-assets specified)${NC}"
  echo ""
fi

# Check if dist directory exists
if [ ! -d "dist" ] && [ "$DRY_RUN" = false ]; then
  echo -e "${RED}Error: dist directory not found${NC}"
  echo -e "${YELLOW}Hint: Run without --skip-build-assets to build assets first${NC}"
  exit 1
fi

# Build Docker image
echo -e "${YELLOW}→ Building Docker image...${NC}"
if [ "$DRY_RUN" = true ]; then
  echo -e "${BLUE}  [DRY RUN] Would run:${NC}"
  echo -e "${BLUE}    docker build \\${NC}"
  echo -e "${BLUE}      --label org.opencontainers.image.version=${VERSION} \\${NC}"
  echo -e "${BLUE}      --label org.opencontainers.image.revision=${GIT_SHA} \\${NC}"
  echo -e "${BLUE}      -t ${IMAGE_VERSION} \\${NC}"
  echo -e "${BLUE}      -t ${IMAGE_LATEST} \\${NC}"
  echo -e "${BLUE}      .${NC}"
else
  if ! docker build \
    --platform=linux/amd64 \
    --label "org.opencontainers.image.version=${VERSION}" \
    --label "org.opencontainers.image.revision=${GIT_SHA}" \
    -t "${IMAGE_VERSION}" \
    -t "${IMAGE_LATEST}" \
    .; then
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Docker image built successfully${NC}"
fi
echo ""

# Push to registry if requested
if [ "$PUSH" = true ]; then
  echo -e "${YELLOW}→ Pushing to registry...${NC}"
  if [ "$DRY_RUN" = true ]; then
    echo -e "${BLUE}  [DRY RUN] Would run:${NC}"
    echo -e "${BLUE}    docker push ${IMAGE_VERSION}${NC}"
    echo -e "${BLUE}    docker push ${IMAGE_LATEST}${NC}"
  else
    if ! docker push "${IMAGE_VERSION}"; then
      echo -e "${RED}✗ Failed to push ${IMAGE_VERSION}${NC}"
      exit 1
    fi
    echo -e "${GREEN}✓ Pushed ${IMAGE_VERSION}${NC}"
    
    if ! docker push "${IMAGE_LATEST}"; then
      echo -e "${RED}✗ Failed to push ${IMAGE_LATEST}${NC}"
      exit 1
    fi
    echo -e "${GREEN}✓ Pushed ${IMAGE_LATEST}${NC}"
  fi
  echo ""
fi

# Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Build Complete                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
if [ "$DRY_RUN" = false ]; then
  echo -e "${GREEN}✓ Image: ${IMAGE_VERSION}${NC}"
  echo -e "${GREEN}✓ Image: ${IMAGE_LATEST}${NC}"
  if [ "$PUSH" = true ]; then
    echo -e "${GREEN}✓ Pushed to registry${NC}"
  else
    echo -e "${YELLOW}  (not pushed - use --push to push)${NC}"
  fi
else
  echo -e "${BLUE}This was a dry run. No changes were made.${NC}"
fi
