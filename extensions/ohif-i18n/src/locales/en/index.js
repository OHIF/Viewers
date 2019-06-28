import Buttons from './Buttons.json';
import CineDialog from './CineDialog.json';
import Common from './Common.json';
import Header from './Header.json';
import MeasurementTable from './MeasurementTable.json';
import UserPreferencesModal from './UserPreferencesModal.json';

/** Sublanguages */
import en_US from './US';
import en_UK from './UK';

export default {
  en: {
    Buttons,
    CineDialog,
    Common,
    Header,
    MeasurementTable,
    UserPreferencesModal,
  },
  ...en_US,
  ...en_UK,
};
