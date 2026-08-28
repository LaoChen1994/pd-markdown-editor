# Automated npm releases

The release workflow uses npm trusted publishing (OIDC), so it does not rely on a long-lived npm token or interactive one-time passwords.

Before the first automated publish, configure a trusted publisher for each npm package (`pd-editor-core`, `pd-editor-react`, and `pd-editor-vue`):

1. Open the package on npm and go to **Settings → Trusted Publisher**.
2. Select **GitHub Actions**.
3. Set the organization or user to `LaoChen1994`.
4. Set the repository to `pd-markdown-editor`.
5. Set the workflow filename to `release.yml`.
6. Leave the environment blank unless the workflow later adds a GitHub environment.

The workflow grants `id-token: write`, uses Node.js 24, and installs npm 11.5.1 before Changesets publishes. Once trusted publishing is configured for all three packages, the obsolete `NPM_TOKEN` repository secret can be removed.

For every package change, add a Changeset and merge it to `main`. Changesets opens or updates a version pull request; merging that pull request triggers publication.
