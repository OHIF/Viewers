#!/bin/bash

# Base directory path
COMPONENTS_DIR="/Users/alireza/dev/admin/Viewers.git.worktrees/fix/remove-legacy-ui/platform/ui/src/components"

# Directories to keep
KEEP_DIRS=(
  "EmptyStudies"
  "StudyListTable"
  "StudyListPagination"
  "StudyListFilter"
  "InvestigationalUseDialog"
  "StudyListExpandedRow"
  "Table"
  "TableBody"
  "TableCell"
  "TableHead"
  "TableRow"
  "Select"
  "InputGroup"
  "LegacyButton"
  "Typography"
  "InputDateRange"
  "InputLabelWrapper"
  "InputMultiSelect"
  "InputText"
  "Icon"
  "LegacyButtonGroup"
)

# Safety checks
if [ ! -d "$COMPONENTS_DIR" ]; then
  echo "Error: Components directory not found at $COMPONENTS_DIR"
  exit 1
fi

echo "Preparing to remove unwanted component directories..."
echo "The following directories will be kept:"
for dir in "${KEEP_DIRS[@]}"; do
  echo "  - $dir"
done

# Get all directories in the components directory
ALL_DIRS=()
while IFS= read -r dir; do
  # Only add directories, not files like index.js
  if [ -d "$dir" ]; then
    ALL_DIRS+=("$(basename "$dir")")
  fi
done < <(find "$COMPONENTS_DIR" -mindepth 1 -maxdepth 1 -type d)

# Calculate which directories to remove
REMOVE_DIRS=()
for dir in "${ALL_DIRS[@]}"; do
  # Check if directory should be kept
  keep=false
  for keep_dir in "${KEEP_DIRS[@]}"; do
    if [ "$dir" == "$keep_dir" ]; then
      keep=true
      break
    fi
  done
  
  # If not in keep list, add to remove list
  if [ "$keep" == false ]; then
    REMOVE_DIRS+=("$dir")
  fi
done

# Another safety check - make sure we're not removing all directories
if [ ${#REMOVE_DIRS[@]} -eq 0 ]; then
  echo "No directories to remove. Exiting."
  exit 0
fi

if [ ${#REMOVE_DIRS[@]} -eq ${#ALL_DIRS[@]} ]; then
  echo "Error: Script would remove all component directories. This seems wrong. Aborting."
  exit 1
fi

# Calculate the percentage of directories being removed
PERCENT_REMOVED=$(( ${#REMOVE_DIRS[@]} * 100 / ${#ALL_DIRS[@]} ))

# If removing > 90% of directories, warn the user
if [ $PERCENT_REMOVED -gt 90 ]; then
  echo "Warning: This script will remove $PERCENT_REMOVED% of component directories."
  echo "This seems unusually high. Please confirm this is correct."
  read -p "Continue? (y/n): " confirm
  if [ "$confirm" != "y" ]; then
    echo "Operation cancelled."
    exit 1
  fi
fi

# Display directories to be removed
echo ""
echo "The following ${#REMOVE_DIRS[@]} directories will be REMOVED:"
for dir in "${REMOVE_DIRS[@]}"; do
  echo "  - $dir"
done
echo ""
echo "Keeping ${#KEEP_DIRS[@]} directories and removing ${#REMOVE_DIRS[@]} directories."
echo ""

# Confirm before proceeding
read -p "Proceed with removal? (y/n): " confirm
if [ "$confirm" != "y" ]; then
  echo "Operation cancelled."
  exit 1
fi

echo "Removing directories..."

# Remove directories
count=0
total=${#REMOVE_DIRS[@]}
for dir in "${REMOVE_DIRS[@]}"; do
  count=$((count + 1))
  echo "[$count/$total] Removing $dir..."
  rm -rf "$COMPONENTS_DIR/$dir"
done

echo "Complete! Removed ${#REMOVE_DIRS[@]} unwanted component directories."