/**
 * Customization ids owned by `ui-next`: the component here is the consumer, so
 * the shape it reads is declared here, next to that consumer. The default value
 * is registered by `extension-default`
 * (`src/customizations/studyBrowserCustomization.ts`) — declaring the type here
 * is what lets that package's default be checked against this contract.
 */
declare global {
  namespace AppTypes {
    interface Customizations {
      /**
       * Sort options offered by the study browser's sort dropdown. Read by
       * `StudyBrowserSort`, which indexes `[0]` for its initial selection, so a
       * default with at least one entry is expected.
       */
      'studyBrowser.sortFunctions': Array<{
        label: string;
        sortFunction: (a: AppTypes.DisplaySet, b: AppTypes.DisplaySet) => number;
      }>;
    }
  }
}

export {};
