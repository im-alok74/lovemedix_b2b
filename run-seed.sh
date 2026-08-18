#!/bin/bash

# Load environment from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Run the seed script
node scripts/seed-medicines-simple.js
