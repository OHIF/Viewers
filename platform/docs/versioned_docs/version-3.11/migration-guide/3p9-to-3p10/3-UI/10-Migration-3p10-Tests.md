---
title: Tests
summary: Migration guide for test updates in OHIF 3.10, covering changes to how tools are identified and tested, including the transition from class-based to data-attribute-based selection in Cypress tests.
---


## 1. ToolButton `data-active` Attribute

- **Previous**: Checked for a `bg-primary-light` class to determine if a tool was active.
- **Now**: Check for the HTML attribute `data-active="true"`.

### Example

```diff
- cy.get('@wwwcButton').should('have.class', 'bg-primary-light');
+ cy.get('@wwwcButton').should('have.attr', 'data-active', 'true');
```

## 2. Additional Data Attributes

- Each tool button now includes:
  - `data-tool="<toolId>"`
  - `data-active="<true|false>"`

This makes it easier to identify and assert on specific tools in the DOM.

### Example

```diff
- <span data-cy={id}>
+ <span
+   data-cy={id}
+   data-tool={id}
+   data-active={isActive}
+ >
```

## 3. MPR Button Class Change

If you were targeting the `ohif-disabled` class, you need to update your tests to target the `cursor-not-allowed` class.

- **Previous**: `ohif-disabled`
- **Now**: `cursor-not-allowed`

### Example

```diff
- cy.get('[data-cy="MPR"]').should('have.class', 'ohif-disabled');
+ cy.get('[data-cy="MPR"]').should('have.class', 'cursor-not-allowed');
```

## 4. Removal of Stack Scroll Alias

- The `[data-cy="StackScroll"]` element is no longer reliably in the DOM at study load.
- If needed, reintroduce or conditionally assert its presence when appropriate.

```diff
- cy.get('[data-cy="StackScroll"]').as('stackScrollBtn');
+ // Removed due to absence in DOM at study load
```

---

## Summary

1. **Replace** all checks for `bg-primary-light` with `data-active="true"`.
2. **Use** `data-tool` and `data-active` attributes for more robust DOM selection and assertions.
3. **Update** MPR button checks to `cursor-not-allowed`.
4. **Remove** the `[data-cy="StackScroll"]` alias (or only use it when the element is present).
