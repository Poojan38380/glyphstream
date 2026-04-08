name: 📦 Pull Request
description: Describe your changes and submit them for review
body:
  - type: markdown
    attributes:
      value: |
        Thanks for contributing to GlyphStream! Please fill out the information below.
  - type: textarea
    id: description
    attributes:
      label: Description
      description: What does this PR do? Why is it needed?
    validations:
      required: true
  - type: textarea
    id: changes
    attributes:
      label: Changes Made
      description: Summarize the key changes
      placeholder: |
        - Added ...
        - Fixed ...
        - Updated ...
    validations:
      required: true
  - type: textarea
    id: testing
    attributes:
      label: How to Test
      description: Steps for reviewers to verify your changes
      placeholder: |
        1. Run `npm run dev`
        2. Go to `...`
        3. Verify that ...
    validations:
      required: true
  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots
      description: For visual changes, include before/after screenshots or GIFs
  - type: dropdown
    id: type
    attributes:
      label: Type of Change
      multiple: true
      options:
        - Bug fix
        - New feature
        - Documentation update
        - Performance improvement
        - Refactoring
        - Other
    validations:
      required: true
  - type: checkboxes
    id: checklist
    attributes:
      label: Checklist
      options:
        - label: I have tested my changes locally (`npm run dev` and `npm run build`)
          required: true
        - label: I have added a clear description of my changes
          required: true
        - label: My changes follow the existing code style
          required: true
