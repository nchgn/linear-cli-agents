# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2025-02-01

### Added

- `linear cycles list` - List cycles (sprints) with filters
- `linear cycles get` - Get cycle details
- `linear cycles current` - Get the current active cycle for a team
- `formatProgress` utility for colored progress display

## [0.5.1] - 2025-02-01

### Changed

- Updated README with documentation for all new commands

## [0.5.0] - 2025-02-01

### Added

- `linear info` command - comprehensive CLI documentation in JSON for LLM agents
- `linear info --compact` - reduced output for limited context windows
- `linear config set/get/list` commands - manage default configuration
- `linear setup` command - add CLI instructions to CLAUDE.md
- `linear issues bulk-update` - update multiple issues at once
- `linear issues bulk-label` - add/remove labels from multiple issues
- Default team configuration - skip `--team-id` on create commands
- Post-install prompt to optionally update CLAUDE.md

### Changed

- `issues create` and `projects create` now use default team if configured

## [0.4.1] - 2025-01-29

### Fixed

- Teams list, projects get, and users get validation errors

## [0.1.1] - 2025-01-28

### Fixed

- Initial npm package configuration

## [0.1.0] - 2025-01-28

### Added

- Initial release
- Authentication commands (login, logout, status)
- Issue commands (list, get, create, update, delete)
- Schema introspection for LLM discovery
- Raw GraphQL query support
- JSON output format for all commands
- Environment variable support for API key

[Unreleased]: https://github.com/nchgn/linear-cli-agents/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/nchgn/linear-cli-agents/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/nchgn/linear-cli-agents/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/nchgn/linear-cli-agents/compare/v0.1.1...v0.4.1
[0.1.1]: https://github.com/nchgn/linear-cli-agents/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/nchgn/linear-cli-agents/releases/tag/v0.1.0
