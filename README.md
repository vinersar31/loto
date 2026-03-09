# loto

## Deployment Instructions

Currently, the GitHub Pages is configured to serve the `README.md` file from the root of the repository, instead of the Next.js app.

To fix this and make the site work, please follow these steps:

1. Go to your repository **Settings** on GitHub.
2. In the left sidebar, click on **Pages**.
3. Under the **Build and deployment** section, find the **Source** dropdown.
4. Change the source from "Deploy from a branch" to **"GitHub Actions"**.

This repository is configured to use a GitHub Actions workflow (`.github/workflows/fetch_and_deploy.yml`) which automatically builds and deploys the Next.js application, along with the scraped Loto results.
