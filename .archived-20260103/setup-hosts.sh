#!/bin/bash
# Ultrarslanoglu Website - Hosts File Setup (Linux/Mac)

HOSTS_FILE="/etc/hosts"
ENTRIES=(
    "127.0.0.1 ultrarslanoglu.local"
    "127.0.0.1 www.ultrarslanoglu.local"
    "127.0.0.1 api.local"
    "127.0.0.1 api.ultrarslanoglu.local"
)

echo "🔧 Setting up local domains..."

for entry in "${ENTRIES[@]}"; do
    if ! grep -q "^$(echo $entry | sed 's/\./\\./g')$" "$HOSTS_FILE"; then
        echo "Adding: $entry"
        echo "$entry" | sudo tee -a "$HOSTS_FILE" > /dev/null
    else
        echo "✓ Already exists: $entry"
    fi
done

echo "✅ Hosts file updated successfully!"
echo ""
echo "Test with:"
echo "  curl http://ultrarslanoglu.local:3001"
