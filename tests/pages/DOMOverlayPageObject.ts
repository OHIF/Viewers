import { Locator, Page } from '@playwright/test';

export class DOMOverlayPageObject {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get dialog() {
    const page = this.page;

    return {
      get confirmation() {
        const cancelButton = page.getByTestId('untracked-series-modal-cancel-button');
        const confirmButton = page.getByTestId('untracked-series-modal-confirm-button');
        return {
          cancel: {
            button: cancelButton,
            click: async () => {
              await cancelButton.click();
            },
          },
          confirm: {
            button: confirmButton,
            click: async () => {
              await confirmButton.click();
            },
          },
        };
      },
      get input() {
        const locator = page.getByTestId('dialog-input');
        const saveButton = page.getByTestId('input-dialog-save-button');
        return {
          locator,
          fill: async (text: string) => {
            await locator.fill(text);
          },
          fillAndSave: async (text: string) => {
            await locator.fill(text);
            await saveButton.click();
          },
          save: async () => {
            await saveButton.click();
          },
        };
      },
      title: page.locator('[role="dialog"] h2'),
    };
  }

  get viewport() {
    const page = this.page;

    return {
      get annotationContextMenu() {
        return {
          get addLabel() {
            const button = page.getByTestId('context-menu-item').filter({ hasText: 'Add Label' });
            return {
              locator: button,
              click: async () => {
                await button.click();
              },
            };
          },
          get delete() {
            const button = page.getByTestId('context-menu-item').filter({ hasText: 'Delete' });
            return {
              locator: button,
              click: async () => {
                await button.click();
              },
            };
          },
          open: async (annotation: Locator) => {
            await annotation.click({ button: 'right', force: true });
          },
        };
      },
      get measurementTracking() {
        const cancelButton = page.getByTestId('prompt-begin-tracking-cancel-btn');
        const noAndNotAskAgainButton = page.getByTestId(
          'prompt-begin-tracking-no-do-not-ask-again-btn'
        );
        const confirmButton = page.getByTestId('prompt-begin-tracking-yes-btn');
        return {
          locator: page.getByTestId('viewport-notification'),
          cancel: {
            button: cancelButton,
            click: async () => {
              await cancelButton.click();
            },
          },
          noAndNotAskAgain: {
            button: noAndNotAskAgainButton,
            click: async () => {
              await noAndNotAskAgainButton.click();
            },
          },
          confirm: {
            button: confirmButton,
            click: async () => {
              await confirmButton.click();
            },
          },
        };
      },
      get segmentationHydration() {
        const noButton = page.getByTestId('no-hydrate-btn');
        const yesButton = page.getByTestId('yes-hydrate-btn');
        return {
          locator: page.getByTestId('viewport-notification'),
          no: {
            button: noButton,
            click: async () => {
              await noButton.click();
            },
          },
          yes: {
            button: yesButton,
            click: async () => {
              await yesButton.click();
            },
          },
        };
      },
      async getModalityLoadBadgeCount() {
        return await page.locator('css=div[data-cy^="ModalityLoadBadge-"]').count();
      },
    };
  }
}
