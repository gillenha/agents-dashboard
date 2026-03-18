#!/usr/bin/env bash
# =============================================================================
# devpigh — Cloud Build Trigger Setup
# =============================================================================
# Run this ONCE after the initial GCP infrastructure is in place (gcp-setup.sh).
#
# Prerequisite — connect your GitHub repo to Cloud Build first:
#   This requires a one-time manual OAuth step in the GCP console. There is no
#   gcloud CLI equivalent. Navigate to:
#   Cloud Build → Triggers → Connect repository → GitHub (Cloud Build GitHub App)
#   Authorize the app and select the repository before running this script.
#
# After connecting, replace GITHUB_OWNER and GITHUB_REPO below and run this file.
# =============================================================================

PROJECT_ID=harry-gillen-builder
REGION=us-east1

# REPLACE these two values with your actual GitHub owner and repo name
GITHUB_OWNER=<YOUR_GITHUB_USERNAME>
GITHUB_REPO=<YOUR_REPO_NAME>

gcloud builds triggers create github \
  --name=deploy-main \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --repo-owner="$GITHUB_OWNER" \
  --repo-name="$GITHUB_REPO" \
  --branch-pattern='^main$' \
  --build-config=cloudbuild.yaml \
  --description="Build and deploy to Cloud Run on push to main"
