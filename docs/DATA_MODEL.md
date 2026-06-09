# Data Model (Firestore)

## `contributions/{id}`
| Field | Type | Notes |
|---|---|---|
| id | string | `c_<base36>` |
| status | enum | submitted · metadata_complete · draft_generated · in_review · approved · published · rejected |
| submitter | object | name, email, affiliation, orcid? |
| metadata | object | title, category, description, purpose, dependencies, requirements, installation, execution, inputFiles, outputFiles, notes, keywords[], license?, relatedLinks[]? |
| files | array | { name, size, contentType, storageKey, url?, sha? } |
| draft | object? | { markdown, generatedBy, generatedAt, edited } |
| repoPath | string? | target path inside easer_repository |
| githubCommitUrl | string? | commit or PR URL |
| githubPrNumber | number? | when strategy = pull_request |
| reviewNote | string? | rejection reason |
| audit | array | { at, actor, action, note? } |
| createdAt / updatedAt | ISO string | |

## `registry/{id}` (public, read-only)
title, category, author, affiliation, description, keywords[], repoPath, githubUrl, approvedAt.

## `audit/{autoId}`
contributionId, at, actor, action, note?. Append-only.

## `contributors/{id}` (reserved)
Aggregated per-researcher record for future contributor profile pages.

## Repository layout written on approval
```
<GITHUB_CONTRIB_DIR>/<category-dir>/<title-slug>/
  README.md            ← generated documentation
  <attached files ≤5MB>
```
`category-dir` ∈ models, datasets, gis, reports, docs, scripts, resources (see `src/lib/constants.ts`).
