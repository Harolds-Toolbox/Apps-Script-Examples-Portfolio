# Dynamic project intake tracker

## Problem

Many Sheet trackers start as a fixed template and become brittle when teams need to add, close, reorder, or archive repeating work sections.

## Architecture

`Custom menu + validated dialog → stable project block IDs → dynamic rows and validation → JSON archive`

## How it works

- Creates consistently formatted project blocks from a small modal form.
- Identifies blocks by hidden-in-plain-sight UUID markers, not by fragile row numbers.
- Reads status and priority choices from a configuration tab.
- Adds work items safely and rebuilds validation/formatting after structural changes.
- Archives the complete block as JSON before removing it from the active tracker.
- Uses a document lock around structural edits.

## Configure

Create a bound Apps Script project, add these files, run `setupProjectTracker()`, then reload the Sheet. Edit the `Tracker Config` tab to change dropdown values.

## Portfolio note

This reproduces the useful dynamic-layout techniques from a larger operational tracker using a neutral project-intake model, without its employer-specific fields, colours, roles, or branding.
