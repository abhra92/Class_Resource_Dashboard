#!/usr/bin/env python3
"""
File Index Generator for Class Resources Website
================================================

This script scans specified directories (syllabus, notes, assignments) and
generates a JSON file (files.json) containing metadata about all files and folders.
The generated JSON is consumed by index.html to dynamically render the file listing.

Usage:
    python generate.py

Output:
    files.json - Contains file structure and metadata for each section

Author: Abhrajyoti Dhara
Project: Class Resources - BCA 6th Semester
"""

import os
import json
from datetime import datetime

# ==============================================================================
# CONFIGURATION
# ==============================================================================
# Define the folders to scan for resources shown in the dashboard.
# Keep this list explicit so ordering is predictable in the UI.
TARGET_FOLDERS = ["syllabus", "notes", "assignments", "PYQ", "vanilla js dark mode switch"]

# Output filename for the generated JSON
OUTPUT_FILE = "files.json"


def get_files_recursive(folder_path):
    """
    Recursively scans a directory and returns its structure as a list.

    This function traverses the given folder and creates a hierarchical structure
    representing all files and subdirectories. Directories are listed first,
    followed by files, both sorted alphabetically (case-insensitive).

    Args:
        folder_path (str): The path to the directory to scan.

    Returns:
        list: A list of dictionaries, where each dictionary represents either:
            - A file: {"type": "file", "name": str, "path": str, "url": str}
            - A directory: {"type": "dir", "name": str, "path": str, "children": list}

    Example output format::

        [
            {"type": "dir", "name": "Chapter1", "path": "notes/Chapter1", "children": [...]},
            {"type": "file", "name": "intro.pdf", "path": "notes/intro.pdf", "url": "notes/intro.pdf"}
        ]
    """
    structure = []
    try:
        # Sort items: Directories first, then files (case-insensitive alphabetical)
        items = sorted(
            os.listdir(folder_path),
            key=lambda x: (not os.path.isdir(os.path.join(folder_path, x)), x.lower())
        )

        for item in items:
            full_path = os.path.join(folder_path, item)

            # Skip hidden files and system files (e.g., .git, .DS_Store, Thumbs.db)
            if item.startswith('.'):
                continue

            if os.path.isdir(full_path):
                # Add directory entry with recursive children
                structure.append({
                    "type": "dir",
                    "name": item,
                    "path": full_path.replace("\\", "/"),  # Normalize Windows paths to Unix style
                    "children": get_files_recursive(full_path)
                })
            else:
                # Add file entry with relative path for cross-platform compatibility
                # Using relative paths ensures it works on both localhost and GitHub Pages
                relative_path = full_path.replace("\\", "/")
                structure.append({
                    "type": "file",
                    "name": item,
                    "path": relative_path,
                    "url": relative_path
                })

    except FileNotFoundError:
        print(f"⚠️ Warning: Folder '{folder_path}' not found. Skipping.")

    return structure

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================
if __name__ == "__main__":
    print("🚀 Starting File Index Generator...")

    # Initialize the data dictionary that will be written to JSON
    data = {}

    # Step 1: Add metadata with current timestamp
    # Using local date format (e.g., "January 25, 2026") for display in the UI
    # This solves the "2 Push" problem by setting the date locally before commit
    now = datetime.now().strftime("%B %d, %Y")
    data["metadata"] = {
        "lastUpdated": now
    }
    print(f"📅 Date set to: {now}")

    # Step 2: Scan each configured folder and build file structure
    for folder in TARGET_FOLDERS:
        if os.path.exists(folder):
            print(f"📂 Scanning '{folder}' folder...")
            data[folder] = get_files_recursive(folder)
        else:
            print(f"❌ Missing folder: '{folder}' - Creating empty entry")
            data[folder] = []

    # Step 3: Write the collected data to JSON file
    # Using UTF-8 encoding for proper character support
    # indent=2 makes the JSON human-readable for debugging
    with open(OUTPUT_FILE, "w", encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    # Success message with next steps
    print(f"✅ Successfully generated '{OUTPUT_FILE}'")
    print("👉 Next steps: git add . → git commit -m 'Update files' → git push")
