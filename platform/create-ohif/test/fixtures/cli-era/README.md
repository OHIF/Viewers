# CLI-era template fixtures

Frozen copies of the old OHIF CLI's extension and mode templates
(`platform/cli/templates`, removed in 3.14). `tests/migrate.test.mjs` scaffolds a
package from them the way the CLI did, then runs `create-ohif migrate` on it.

They are deliberately out of date: they show what a CLI-era package looked like,
which is what `migrate` converts. Don't update them to the current plugin
contract, or the migrate tests stop testing a real migration.
